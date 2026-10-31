-- ==============================================================================
-- SNIPPET 1: 01_setup_catalog_and_legacy_cleanup.sql
-- Título en Supabase: 01 - Setup: Limpieza y Catálogo de Productos
-- Descripción:
--   1. Elimina tablas obsoletas vacías (purchase_details, purchase_headers).
--   2. Agrega stock_quantity y cost_price_usd a public.products.
--   3. Sincroniza bidireccionalmente stock/stock_quantity y purchase_price/cost_price_usd.
-- ==============================================================================

-- 1. Eliminar tablas heredadas sin uso
DROP TABLE IF EXISTS public.purchase_details CASCADE;
DROP TABLE IF EXISTS public.purchase_headers CASCADE;

-- 2. Extender tabla products con columnas de stock y costo en USD
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price_usd numeric(12,2) NOT NULL DEFAULT 0.00;

-- 3. Rellenar datos existentes para consistencia
UPDATE public.products
SET
  stock_quantity = stock,
  cost_price_usd = purchase_price
WHERE stock_quantity <> stock OR cost_price_usd <> purchase_price;

-- 4. Constraints no-negativas
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS chk_products_stock_quantity_non_negative,
  ADD CONSTRAINT chk_products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  DROP CONSTRAINT IF EXISTS chk_products_cost_price_usd_non_negative,
  ADD CONSTRAINT chk_products_cost_price_usd_non_negative CHECK (cost_price_usd >= 0);

-- 5. Trigger de sincronización bidireccional
CREATE OR REPLACE FUNCTION public.sync_products_inventory_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.stock_quantity IS DISTINCT FROM 0 AND NEW.stock = 0 THEN
      NEW.stock := NEW.stock_quantity;
    ELSE
      NEW.stock_quantity := NEW.stock;
    END IF;

    IF NEW.cost_price_usd IS DISTINCT FROM 0.00 AND NEW.purchase_price = 0.00 THEN
      NEW.purchase_price := NEW.cost_price_usd;
    ELSE
      NEW.cost_price_usd := NEW.purchase_price;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity AND NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
      NEW.stock := NEW.stock_quantity;
    ELSIF NEW.stock IS DISTINCT FROM OLD.stock AND NEW.stock_quantity IS NOT DISTINCT FROM OLD.stock_quantity THEN
      NEW.stock_quantity := NEW.stock;
    ELSIF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity AND NEW.stock IS DISTINCT FROM OLD.stock THEN
      NEW.stock := NEW.stock_quantity;
    END IF;

    IF NEW.cost_price_usd IS DISTINCT FROM OLD.cost_price_usd AND NEW.purchase_price IS NOT DISTINCT FROM OLD.purchase_price THEN
      NEW.purchase_price := NEW.cost_price_usd;
    ELSIF NEW.purchase_price IS DISTINCT FROM OLD.purchase_price AND NEW.cost_price_usd IS NOT DISTINCT FROM OLD.cost_price_usd THEN
      NEW.cost_price_usd := NEW.purchase_price;
    ELSIF NEW.cost_price_usd IS DISTINCT FROM OLD.cost_price_usd AND NEW.purchase_price IS DISTINCT FROM OLD.purchase_price THEN
      NEW.purchase_price := NEW.cost_price_usd;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_sync_inventory_columns ON public.products;
CREATE TRIGGER trg_products_sync_inventory_columns
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_products_inventory_columns();

