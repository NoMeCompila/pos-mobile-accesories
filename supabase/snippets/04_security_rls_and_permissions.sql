-- ==============================================================================
-- SNIPPET 4: 04_security_rls_and_permissions.sql
-- Título en Supabase: 04 - Security: Row Level Security y Grants
-- Descripción:
--   1. Activa RLS en las 5 tablas nuevas.
--   2. Define políticas para otorgar acceso total a perfiles admin y manager.
--   3. Restringe acceso de lectura/escritura a cajeros, técnicos y clientes.
--   4. Otorga permisos explícitos (GRANT) a authenticated y service_role.
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas nuevas
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 2. Limpieza de políticas previas si se re-ejecuta
DROP POLICY IF EXISTS "purchase_orders_admin_manager_all" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_order_items_admin_manager_all" ON public.purchase_order_items;
DROP POLICY IF EXISTS "supplier_invoices_admin_manager_all" ON public.supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_select" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_insert" ON public.inventory_movements;

-- 3. Políticas para PURCHASE ORDERS (Admin y Manager)
CREATE POLICY "purchase_orders_admin_manager_all" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 4. Políticas para PURCHASE ORDER ITEMS (Admin y Manager)
CREATE POLICY "purchase_order_items_admin_manager_all" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5. Políticas para SUPPLIER INVOICES (Admin y Manager)
CREATE POLICY "supplier_invoices_admin_manager_all" ON public.supplier_invoices
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 6. Políticas para SUPPLIER INVOICE ITEMS (Admin y Manager)
CREATE POLICY "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 7. Políticas para INVENTORY MOVEMENTS (Admin y Manager: Solo Select e Insert)
CREATE POLICY "inventory_movements_admin_manager_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

CREATE POLICY "inventory_movements_admin_manager_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 8. Permisos de tabla explícitos (Grants DML)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.purchase_orders,
  public.purchase_order_items,
  public.supplier_invoices,
  public.supplier_invoice_items
TO authenticated, service_role;

GRANT SELECT, INSERT ON TABLE public.inventory_movements TO authenticated, service_role;

-- 9. Permisos de ejecución de funciones
GRANT EXECUTE ON FUNCTION
  public.sync_products_inventory_columns(),
  public.prevent_inventory_movements_mutation(),
  public.apply_supplier_invoice_item_stock(uuid),
  public.handle_supplier_invoice_item_insert(),
  public.handle_supplier_invoice_status_change()
TO authenticated, service_role;

