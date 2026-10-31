-- ==============================================================================
-- SNIPPET 3: 03_logic_stock_triggers_and_automation.sql
-- Título en Supabase: 03 - Logic: Triggers de Stock, Costos y Ledger
-- Descripción:
--   Implementa la lógica de negocio atómica dentro de PostgreSQL:
--   1. Inmutabilidad estricta en inventory_movements (bloquea UPDATE y DELETE).
--   2. Función atómica para aplicar recepción de ítem de factura a stock y ledger.
--   3. Trigger automático al insertar ítems en facturas recibidas.
--   4. Trigger automático de cambio de estado:
--      - draft -> received/confirmed: aplica stock y actualiza costo de reposición.
--      - received -> cancelled: inserta movimiento negativo compensatorio y decrementa stock.
-- ==============================================================================

-- 1. Inmutabilidad de inventory_movements
CREATE OR REPLACE FUNCTION public.prevent_inventory_movements_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Immutable Ledger Violation: inventory_movements records cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_movements_immutable ON public.inventory_movements;
CREATE TRIGGER trg_inventory_movements_immutable
  BEFORE UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inventory_movements_mutation();

-- 2. Función atómica para aplicar stock de un ítem de factura recibida
CREATE OR REPLACE FUNCTION public.apply_supplier_invoice_item_stock(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.supplier_invoice_items%ROWTYPE;
  v_invoice public.supplier_invoices%ROWTYPE;
  v_new_stock integer;
  v_unit_cost_usd numeric(12,2);
BEGIN
  SELECT * INTO v_item
  FROM public.supplier_invoice_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT * INTO v_invoice
  FROM public.supplier_invoices
  WHERE id = v_item.supplier_invoice_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Solo aplicar si la factura está en estado confirmed o received y no cancelada
  IF v_invoice.status NOT IN ('confirmed', 'received') OR v_invoice.payment_status = 'cancelled' THEN
    RETURN;
  END IF;

  -- Verificación de idempotencia: no duplicar si ya se registró el movimiento positivo
  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE origin_type = 'supplier_purchase'
      AND origin_id = v_item.id
      AND quantity_delta > 0
  ) THEN
    RETURN;
  END IF;

  -- Normalización de costo unitario a USD según moneda y tipo de cambio
  IF v_invoice.currency = 'USD' THEN
    v_unit_cost_usd := v_item.unit_cost;
  ELSE
    v_unit_cost_usd := ROUND(v_item.unit_cost / v_invoice.exchange_rate, 2);
  END IF;

  -- Bloquear fila y actualizar stock_quantity y costo de reposición cost_price_usd
  UPDATE public.products
  SET
    stock_quantity = stock_quantity + v_item.quantity_received,
    cost_price_usd = v_unit_cost_usd
  WHERE id = v_item.product_id
  RETURNING stock_quantity INTO v_new_stock;

  -- Registrar en el libro mayor inmutable de movimientos
  INSERT INTO public.inventory_movements (
    product_id,
    origin_type,
    origin_id,
    quantity_delta,
    resulting_stock,
    cost_snapshot,
    created_by
  ) VALUES (
    v_item.product_id,
    'supplier_purchase',
    v_item.id,
    v_item.quantity_received,
    v_new_stock,
    v_unit_cost_usd,
    COALESCE(v_invoice.user_id, auth.uid())
  );
END;
$$;

-- 3. Trigger al insertar ítem en factura que ya está en estado confirmed/received
CREATE OR REPLACE FUNCTION public.handle_supplier_invoice_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.apply_supplier_invoice_item_stock(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supplier_invoice_items_after_insert ON public.supplier_invoice_items;
CREATE TRIGGER trg_supplier_invoice_items_after_insert
  AFTER INSERT ON public.supplier_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_supplier_invoice_item_insert();

-- 4. Trigger al actualizar estado de la factura (recepción o cancelación reversora)
CREATE OR REPLACE FUNCTION public.handle_supplier_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_new_stock integer;
  v_cost_snapshot numeric(12,2);
BEGIN
  -- Caso A: Transición a confirmed/received (aplica stock de todos los ítems pendientes)
  IF NEW.status IN ('confirmed', 'received')
     AND NEW.payment_status <> 'cancelled'
     AND (OLD.status NOT IN ('confirmed', 'received') OR OLD.payment_status = 'cancelled') THEN
    FOR v_item IN
      SELECT id
      FROM public.supplier_invoice_items
      WHERE supplier_invoice_id = NEW.id
      ORDER BY created_at ASC, id ASC
    LOOP
      PERFORM public.apply_supplier_invoice_item_stock(v_item.id);
    END LOOP;
  END IF;

  -- Caso B: Cancelación de la factura (reversión compensatoria en el ledger y resta de stock)
  IF (NEW.status = 'cancelled' AND OLD.status <> 'cancelled')
     OR (NEW.payment_status = 'cancelled' AND OLD.payment_status <> 'cancelled') THEN
    FOR v_item IN
      SELECT i.id, i.product_id, i.quantity_received, m.cost_snapshot
      FROM public.supplier_invoice_items i
      INNER JOIN public.inventory_movements m
        ON m.origin_type = 'supplier_purchase'
       AND m.origin_id = i.id
       AND m.quantity_delta > 0
      WHERE i.supplier_invoice_id = NEW.id
        AND NOT EXISTS (
          SELECT 1
          FROM public.inventory_movements rev
          WHERE rev.origin_type = 'supplier_purchase'
            AND rev.origin_id = i.id
            AND rev.quantity_delta < 0
        )
      ORDER BY i.created_at ASC, i.id ASC
    LOOP
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_item.quantity_received
      WHERE id = v_item.product_id
      RETURNING stock_quantity INTO v_new_stock;

      v_cost_snapshot := v_item.cost_snapshot;

      INSERT INTO public.inventory_movements (
        product_id,
        origin_type,
        origin_id,
        quantity_delta,
        resulting_stock,
        cost_snapshot,
        created_by
      ) VALUES (
        v_item.product_id,
        'supplier_purchase',
        v_item.id,
        -v_item.quantity_received,
        v_new_stock,
        v_cost_snapshot,
        COALESCE(NEW.user_id, auth.uid())
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supplier_invoices_status_change ON public.supplier_invoices;
CREATE TRIGGER trg_supplier_invoices_status_change
  AFTER UPDATE OF status, payment_status ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_supplier_invoice_status_change();

