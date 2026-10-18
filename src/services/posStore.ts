import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, CartItem, Customer, Ticket, CashShift, CashMovement, PaymentMethod } from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_TICKETS, INITIAL_SHIFT } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'voltacc_pos_products_v1',
  CART: 'voltacc_pos_cart_v1',
  HELD_TICKETS: 'voltacc_pos_held_tickets_v1',
  TICKETS: 'voltacc_pos_tickets_v1',
  SHIFT: 'voltacc_pos_shift_v1',
  CUSTOMER: 'voltacc_pos_active_customer_v1',
  COUPON: 'voltacc_pos_active_coupon_v1',
};

// Initial Cart Items matching screenshot
const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'cart-1',
    product: INITIAL_PRODUCTS[0], // Funda Armor
    quantity: 1,
    unitPrice: 24.99,
  },
  {
    id: 'cart-2',
    product: INITIAL_PRODUCTS[1], // Protector 9H
    quantity: 1,
    unitPrice: 18.99,
  },
  {
    id: 'cart-3',
    product: INITIAL_PRODUCTS[2], // Cargador GaN
    quantity: 2,
    unitPrice: 29.99,
  }
];

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

// ---- PRODUCTS API ----
export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
    staleTime: Infinity,
  });

  const addProductMutation = useMutation({
    mutationFn: async (newProd: Product) => {
      const current = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      const updated = [newProd, ...current];
      setStored(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['products'], data),
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ sku, delta }: { sku: string; delta: number }) => {
      const current = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      const updated = current.map((p) => {
        if (p.sku === sku) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock, isCritical: newStock <= 3 };
        }
        return p;
      });
      setStored(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['products'], data),
  });

  return {
    products: query.data || INITIAL_PRODUCTS,
    addProduct: addProductMutation.mutate,
    updateStock: updateStockMutation.mutate,
  };
}

// ---- CART & ACTIVE TICKET API ----
export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: () => getStored<CartItem[]>(STORAGE_KEYS.CART, INITIAL_CART_ITEMS),
    staleTime: Infinity,
  });

  const customerQuery = useQuery<Customer>({
    queryKey: ['activeCustomer'],
    queryFn: () => getStored<Customer>(STORAGE_KEYS.CUSTOMER, INITIAL_CUSTOMERS[0]),
    staleTime: Infinity,
  });

  const couponQuery = useQuery<string | null>({
    queryKey: ['activeCoupon'],
    queryFn: () => getStored<string | null>(STORAGE_KEYS.COUPON, 'ACC-10%'),
    staleTime: Infinity,
  });

  const heldTicketsQuery = useQuery<Array<{ id: string; name: string; items: CartItem[]; customer: Customer; time: string }>>({
    queryKey: ['heldTickets'],
    queryFn: () => getStored(STORAGE_KEYS.HELD_TICKETS, []),
    staleTime: Infinity,
  });

  const cart = cartQuery.data || INITIAL_CART_ITEMS;
  const customer = customerQuery.data || INITIAL_CUSTOMERS[0];
  const coupon = couponQuery.data;
  const heldTickets = heldTicketsQuery.data || [];

  // Calculations
  const grossSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountRate = coupon === 'ACC-10%' ? 0.10 : 0;
  const discountAmount = Math.round(grossSubtotal * discountRate * 100) / 100;
  const taxableBase = Math.round((grossSubtotal - discountAmount) * 100) / 100;
  const vat = Math.round(taxableBase * 0.21 * 100) / 100;
  const total = Math.round((taxableBase + vat) * 100) / 100;
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateCart = (newCart: CartItem[]) => {
    setStored(STORAGE_KEYS.CART, newCart);
    queryClient.setQueryData(['cart'], newCart);
  };

  const addItem = (product: Product, quantity = 1) => {
    const existing = cart.find((i) => i.product.sku === product.sku);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map((i) =>
        i.product.sku === product.sku ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      updated = [
        ...cart,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          quantity,
          unitPrice: product.price,
        },
      ];
    }
    updateCart(updated);
  };

  const setQuantity = (sku: string, qty: number) => {
    if (qty <= 0) {
      removeItem(sku);
    } else {
      const updated = cart.map((i) => (i.product.sku === sku ? { ...i, quantity: qty } : i));
      updateCart(updated);
    }
  };

  const removeItem = (sku: string) => {
    const updated = cart.filter((i) => i.product.sku !== sku);
    updateCart(updated);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const setCustomer = (newCustomer: Customer) => {
    setStored(STORAGE_KEYS.CUSTOMER, newCustomer);
    queryClient.setQueryData(['activeCustomer'], newCustomer);
  };

  const setCoupon = (code: string | null) => {
    setStored(STORAGE_KEYS.COUPON, code);
    queryClient.setQueryData(['activeCoupon'], code);
  };

  // Hold / Recall Ticket
  const holdTicket = () => {
    if (cart.length === 0) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const held = {
      id: `held-${Date.now()}`,
      name: `Ticket #${Math.floor(1000 + Math.random() * 9000)} (${customer.name})`,
      items: cart,
      customer,
      time: timeStr,
    };
    const updatedHeld = [held, ...heldTickets];
    setStored(STORAGE_KEYS.HELD_TICKETS, updatedHeld);
    queryClient.setQueryData(['heldTickets'], updatedHeld);
    clearCart();
    setCustomer(INITIAL_CUSTOMERS[0]);
  };

  const recallTicket = (heldId: string) => {
    const item = heldTickets.find((h) => h.id === heldId);
    if (!item) return;
    updateCart(item.items);
    setCustomer(item.customer);
    const updatedHeld = heldTickets.filter((h) => h.id !== heldId);
    setStored(STORAGE_KEYS.HELD_TICKETS, updatedHeld);
    queryClient.setQueryData(['heldTickets'], updatedHeld);
  };

  return {
    cart,
    customer,
    coupon,
    heldTickets,
    grossSubtotal,
    discountAmount,
    taxableBase,
    vat,
    total,
    totalUnits,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    setCustomer,
    setCoupon,
    holdTicket,
    recallTicket,
  };
}

// ---- SALES HISTORY API ----
export function useSalesHistory() {
  const queryClient = useQueryClient();

  const query = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => getStored<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS),
    staleTime: Infinity,
  });

  const tickets = query.data || INITIAL_TICKETS;

  const addTicketMutation = useMutation({
    mutationFn: async (ticket: Ticket) => {
      const current = getStored<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
      const updated = [ticket, ...current];
      setStored(STORAGE_KEYS.TICKETS, updated);
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['tickets'], data),
  });

  const refundTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const current = getStored<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
      const updated = current.map((t) => {
        if (t.id === ticketId || t.ticketNumber === ticketId) {
          return { ...t, status: 'refunded' as const };
        }
        return t;
      });
      setStored(STORAGE_KEYS.TICKETS, updated);
      return updated;
    },
    onSuccess: (data) => queryClient.setQueryData(['tickets'], data),
  });

  return {
    tickets,
    addTicket: addTicketMutation.mutate,
    refundTicket: refundTicketMutation.mutate,
  };
}

// ---- CASH SHIFT API ----
export function useCashShift() {
  const queryClient = useQueryClient();

  const query = useQuery<CashShift>({
    queryKey: ['cashShift'],
    queryFn: () => getStored<CashShift>(STORAGE_KEYS.SHIFT, INITIAL_SHIFT),
    staleTime: Infinity,
  });

  const shift = query.data || INITIAL_SHIFT;

  const updateShift = (newShift: CashShift) => {
    setStored(STORAGE_KEYS.SHIFT, newShift);
    queryClient.setQueryData(['cashShift'], newShift);
  };

  const addMovement = (movement: Omit<CashMovement, 'id' | 'time'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullMovement: CashMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      time: timeStr,
    };
    const newMovements = [...shift.movements, fullMovement];
    const newCash = movement.type === 'in' 
      ? shift.cashSales + movement.amount 
      : Math.max(0, shift.cashSales - movement.amount);

    updateShift({
      ...shift,
      cashSales: newCash,
      movements: newMovements,
    });
  };

  const recordSale = (amount: number, method: PaymentMethod) => {
    const updated = {
      ...shift,
      ticketCount: shift.ticketCount + 1,
      cashSales: method === 'cash' ? shift.cashSales + amount : shift.cashSales,
      cardSales: method === 'card' ? shift.cardSales + amount : shift.cardSales,
      bizumSales: method === 'bizum' ? shift.bizumSales + amount : shift.bizumSales,
    };
    updateShift(updated);
  };

  const closeShift = (countedCash: number) => {
    const expectedCash = shift.initialFloat + shift.cashSales;
    const discrepancy = countedCash - expectedCash;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    updateShift({
      ...shift,
      status: 'closed',
      closedAt: timeStr,
      countedCash,
      discrepancy,
    });
  };

  const openShift = (initialFloat: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    updateShift({
      id: `shift-${Date.now()}`,
      terminalNode: 'Terminal Node #02',
      operator: 'E. Harrison',
      status: 'open',
      openedAt: timeStr,
      initialFloat,
      cashSales: 0,
      cardSales: 0,
      bizumSales: 0,
      ticketCount: 0,
      movements: [
        {
          id: `mov-init-${Date.now()}`,
          time: timeStr,
          type: 'in',
          amount: initialFloat,
          concept: 'Apertura de turno: Fondo de cambio',
          authorizedBy: 'E. Harrison',
        },
      ],
      auditHash: Math.random().toString(36).substring(2, 6) + '..' + Math.random().toString(36).substring(2, 6),
    });
  };

  return {
    shift,
    addMovement,
    recordSale,
    closeShift,
    openShift,
  };
}
