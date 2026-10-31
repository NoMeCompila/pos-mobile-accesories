-- ==============================================================================
-- SNIPPET 5: 05_seed_suppliers_orders_and_invoices.sql
-- Título en Supabase: 05 - Seed: Proveedores y Facturas de Prueba
-- Descripción:
--   Inserta datos realistas para desarrollo local o staging:
--   1. Asegura usuarios de prueba (Admin y Manager).
--   2. Registra marcas y 3 proveedores mayoristas de accesorios móviles con CUITs.
--   3. Inserta productos de prueba (ej. "Funda Armor MagSafe Titanio").
--   4. Inserta 2 órdenes de compra con sus ítems.
--   5. Inserta 2 facturas recibidas y sus ítems, disparando los triggers
--      automáticos de stock, costo de reposición y libro mayor de movimientos.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  v_manager_id  uuid := 'a0000000-0000-0000-0000-000000000002';
  v_branch_1    uuid := 'b0000000-0000-0000-0000-000000000001';

  v_brand_apple   uuid := '10000000-0000-0000-0000-000000000001';
  v_brand_spigen  uuid := '10000000-0000-0000-0000-000000000002';
  v_brand_anker   uuid := '10000000-0000-0000-0000-000000000003';

  v_supplier_1 uuid := '20000000-0000-0000-0000-000000000001';
  v_supplier_2 uuid := '20000000-0000-0000-0000-000000000002';
  v_supplier_3 uuid := '20000000-0000-0000-0000-000000000003';

  v_prod_magsafe_case   uuid := '30000000-0000-0000-0000-000000000001';
  v_prod_tempered_glass uuid := '30000000-0000-0000-0000-000000000002';
  v_prod_usbc_cable     uuid := '30000000-0000-0000-0000-000000000003';
  v_prod_iphone_battery uuid := '30000000-0000-0000-0000-000000000004';

  v_po_1 uuid := '40000000-0000-0000-0000-000000000001';
  v_po_2 uuid := '40000000-0000-0000-0000-000000000002';

  v_po_item_1 uuid := '41000000-0000-0000-0000-000000000001';
  v_po_item_2 uuid := '41000000-0000-0000-0000-000000000002';
  v_po_item_3 uuid := '41000000-0000-0000-0000-000000000003';

  v_inv_1 uuid := '50000000-0000-0000-0000-000000000001';
  v_inv_2 uuid := '50000000-0000-0000-0000-000000000002';

  v_inv_item_1 uuid := '51000000-0000-0000-0000-000000000001';
  v_inv_item_2 uuid := '51000000-0000-0000-0000-000000000002';
  v_inv_item_3 uuid := '51000000-0000-0000-0000-000000000003';
BEGIN
  -- 1. Usuarios de prueba
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  )
  VALUES
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@pos.local',
      crypt('admin123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","first_name":"Super","last_name":"Admin"}',
      'authenticated', 'authenticated', now(), now()
    ),
    (
      v_manager_id, '00000000-0000-0000-0000-000000000000', 'manager_suc1@pos.local',
      crypt('manager123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"manager","first_name":"Martin","last_name":"Manager","branch_id":"b0000000-0000-0000-0000-000000000001"}',
      'authenticated', 'authenticated', now(), now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, branch_id, status)
  VALUES
    (v_admin_id, 'admin@pos.local', 'Super', 'Admin', 'admin', NULL, true),
    (v_manager_id, 'manager_suc1@pos.local', 'Martin', 'Manager', 'manager', v_branch_1, true)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

  -- 2. Marcas
  INSERT INTO public.brands (id, name, is_active)
  VALUES
    (v_brand_apple,  'Apple',  true),
    (v_brand_spigen, 'Spigen', true),
    (v_brand_anker,  'Anker',  true)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_brand_apple  FROM public.brands WHERE name = 'Apple'  LIMIT 1;
  SELECT id INTO v_brand_spigen FROM public.brands WHERE name = 'Spigen' LIMIT 1;
  SELECT id INTO v_brand_anker  FROM public.brands WHERE name = 'Anker'  LIMIT 1;

  -- 3. 3 Proveedores Mayoristas Argentinos con CUITs
  INSERT INTO public.suppliers (
    id, company_name, tax_id, contact_name, email, phone, address, is_active
  )
  VALUES
    (
      v_supplier_1,
      'Distribuidora Celular SA',
      '30-71458923-4',
      'Mariano Gomez',
      'ventas@distribuidoracelular.com.ar',
      '+54 11 4321-8890',
      'Av. Corrientes 2450, CABA',
      true
    ),
    (
      v_supplier_2,
      'Importadora Once Tech SRL',
      '30-71682341-9',
      'Luciana Fernandez',
      'mayorista@oncetech.com.ar',
      '+54 11 4951-3342',
      'Pasteur 412, CABA',
      true
    ),
    (
      v_supplier_3,
      'Repuestos Moviles Argentina SA',
      '30-70994125-7',
      'Roberto Sanchez',
      'pedidos@repuestosmoviles.com.ar',
      '+54 11 5234-9901',
      'Lavalle 1890, CABA',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    tax_id = EXCLUDED.tax_id,
    is_active = EXCLUDED.is_active;

  -- 4. Productos de catálogo (Stock inicial antes de recepción de compras)
  INSERT INTO public.products (
    id, brand_id, product_code, name, description,
    stock, stock_quantity, purchase_price, cost_price_usd, sale_price, is_active
  )
  VALUES
    (
      v_prod_magsafe_case, v_brand_spigen, '7798001000011',
      'Funda Armor MagSafe Titanio',
      'Funda reforzada con anillo MagSafe para iPhone 15 Pro Max',
      10, 10, 8.00, 8.00, 18.00, true
    ),
    (
      v_prod_tempered_glass, v_brand_spigen, '7798001000028',
      'Vidrio Templado 9D Full Glue iPhone 15',
      'Protector de pantalla oleofobico bordes curvos 9H',
      30, 30, 1.80, 1.80, 6.00, true
    ),
    (
      v_prod_usbc_cable, v_brand_anker, '7798001000035',
      'Cable USB-C a USB-C Mallado 60W 1.8m',
      'Cable de carga rapida PowerLine III mallado en nylon',
      20, 20, 4.20, 4.20, 11.50, true
    ),
    (
      v_prod_iphone_battery, v_brand_apple, '7798001000042',
      'Bateria Reemplazo Original iPhone 13 3227mAh',
      'Repuesto celda Li-Ion con flex diagnosticable',
      5, 5, 16.00, 16.00, 42.00, true
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Órdenes de Compra
  INSERT INTO public.purchase_orders (
    id, order_number, supplier_id, user_id, branch_id,
    status, expected_date, total_amount_usd, total_amount_ars, notes
  )
  VALUES
    (
      v_po_1, 'PO-2026-0001', v_supplier_1, v_admin_id, v_branch_1,
      'received', CURRENT_DATE - INTERVAL '3 days', 217.50, 261000.00,
      'Reposicion mensual fundas MagSafe y vidrios templados'
    ),
    (
      v_po_2, 'PO-2026-0002', v_supplier_2, v_manager_id, v_branch_1,
      'partially_received', CURRENT_DATE + INTERVAL '2 days', 250.00, 300000.00,
      'Pedido cables carga rapida Anker y baterias iPhone 13'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.purchase_order_items (
    id, purchase_order_id, product_id,
    quantity_ordered, quantity_received, expected_unit_cost_usd
  )
  VALUES
    (v_po_item_1, v_po_1, v_prod_magsafe_case,   15, 15, 8.50),
    (v_po_item_2, v_po_1, v_prod_tempered_glass, 50, 50, 1.80),
    (v_po_item_3, v_po_2, v_prod_usbc_cable,     25, 25, 4.50)
  ON CONFLICT (id) DO NOTHING;

  -- 6. Facturas Recibidas (Al insertar ítems se disparan triggers que incrementan
  --    stock, actualizan cost_price_usd y registran movimientos en inventory_movements)
  INSERT INTO public.supplier_invoices (
    id, supplier_id, purchase_order_id, user_id, branch_id,
    invoice_number, invoice_date, reception_date,
    currency, exchange_rate, subtotal, tax_amount, total_amount,
    status, payment_status, notes
  )
  VALUES
    (
      v_inv_1, v_supplier_1, v_po_1, v_admin_id, v_branch_1,
      'FC-0001-00048291', CURRENT_DATE - INTERVAL '2 days', now() - INTERVAL '2 days',
      'USD', 1200.0000, 217.50, 0.00, 217.50,
      'received', 'paid', 'Factura mayorista Distribuidora Celular SA recibida completa'
    ),
    (
      v_inv_2, v_supplier_2, v_po_2, v_manager_id, v_branch_1,
      'FC-0004-00019302', CURRENT_DATE - INTERVAL '1 day', now() - INTERVAL '1 day',
      'USD', 1215.5000, 112.50, 0.00, 112.50,
      'received', 'pending', 'Recepcion parcial cables USB-C Anker 60W'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.supplier_invoice_items (
    id, supplier_invoice_id, product_id,
    quantity_received, unit_cost, subtotal
  )
  VALUES
    (v_inv_item_1, v_inv_1, v_prod_magsafe_case,   15, 8.50, 127.50),
    (v_inv_item_2, v_inv_1, v_prod_tempered_glass, 50, 1.80,  90.00),
    (v_inv_item_3, v_inv_2, v_prod_usbc_cable,     25, 4.50, 112.50)
  ON CONFLICT (id) DO NOTHING;
END $$;

