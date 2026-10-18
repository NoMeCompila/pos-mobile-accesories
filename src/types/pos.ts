export type NavigationTab = 'home' | 'pos' | 'catalog' | 'drawer' | 'history' | 'login' | 'seller/home';

export type PaymentMethod = 'cash' | 'card' | 'bizum' | 'split';

export type TicketStatus = 'paid' | 'refunded' | 'held' | 'in_progress';

export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  location: string;
  image: string;
  isCritical?: boolean;
  isTop?: boolean;
  isService?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  nif: string;
  points: number;
  phone?: string;
  email?: string;
  isVip?: boolean;
}

export interface TicketLine {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. #TRX-8942
  time: string;
  date: string;
  timestamp: number;
  cashier: string;
  terminal: string;
  customer: Customer;
  items: TicketLine[];
  itemSummary: string;
  subtotal: number;
  discount: number;
  couponCode?: string;
  taxableBase: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  authCode?: string;
  status: TicketStatus;
  notes?: string;
}

export interface CashMovement {
  id: string;
  time: string;
  type: 'in' | 'out';
  amount: number;
  concept: string;
  authorizedBy: string;
}

export interface DenominationCount {
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  b5: number;
  c2: number;
  c1: number;
  c050: number;
  c020: number;
  c010: number;
}

export interface CashShift {
  id: string;
  terminalNode: string;
  operator: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  initialFloat: number;
  cashSales: number;
  cardSales: number;
  bizumSales: number;
  ticketCount: number;
  movements: CashMovement[];
  countedCash?: number;
  discrepancy?: number;
  auditHash: string;
}
