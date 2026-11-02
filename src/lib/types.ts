/**
 * Shared types for BagBox — Bag & Handbag Facebook Shop Manager
 * Steadfast Courier + Supabase Sync + Mobile First
 */

export type Role = "admin" | "owner" | "staff";

export interface Variant {
  id: string;
  size: string; // e.g. "স্ট্যান্ডার্ড", "মিডিয়াম", "লার্জ", "মিনি", "কাস্টম"
  color: string; // e.g. "কালো", "বাদামী", "মেরুন", "ট্যান", "ক্রিম", "পিংক"
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  cat: string; // e.g. "হ্যান্ডব্যাগ", "শোল্ডার ব্যাগ", "টোট ব্যাগ", "ক্রসবডি", "ব্যাকপ্যাক", "পার্স", "অন্যান্য"
  buy: number;
  sell: number;
  low: number;
  variants: Variant[];
  img?: string;
  active?: boolean;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  qty: number;
  price: number;
  buy?: number;
}

export type OrderStatus =
  | "Pending"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type Zone = "inside" | "sub" | "outside";

export interface ShipZone {
  cost: number;
  fee: number;
}

export interface Order {
  id: string;
  ts?: number;
  date: string;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  cod?: number | null;
  zone?: Zone;
  dcost?: number;
  dcharge?: number;
  charge?: number;
  steadfastId?: string; // Consignment ID (CID)
  trackingCode?: string;
  liveStatus?: string;
  liveUpdate?: string;
  statusTs?: number;
  lastMsg?: string;
  incoming?: OrderItem[] | null;
  partial?: boolean;
  partialDismissed?: boolean;
  receivedBack?: OrderItem[];
  status: OrderStatus;
  payment: string;
  note?: string;
}

export interface AdExpense {
  id: string;
  ts: number;
  label: string;
  ch: string;
  amount: number;
  usd?: number;
  rate?: number;
}

export interface SalesDay {
  id: string;
  start: number;
  end: number;
  orders: number;
  sales: number;
  cogs: number;
  delivery: number;
  profit: number;
}

export interface MonthAd {
  id: string;
  month: string;
  usd: number;
  rate: number;
  bdt: number;
  ts: number;
}

export interface Move {
  id: string;
  date: string;
  text: string;
}

export interface Notif {
  id: string;
  ts: number;
  title: string;
  body: string;
}

export interface Settings {
  shopName?: string;
  pin?: string;
  fxRate?: number;
  ship?: {
    inside: ShipZone;
    sub: ShipZone;
    outside: ShipZone;
  };
  steadfast?: {
    key: string;
    secret: string;
    base: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
  bdCourierKey?: string;
  mockSteadfast?: boolean;
}

export interface ShopData {
  products: Product[];
  orders: Order[];
  moves: Move[];
  ads: AdExpense[];
  notifs?: Notif[];
  settings?: Settings;
  salesDay: { start: number } | null;
  salesDays: SalesDay[];
  monthAds: MonthAd[];
}

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  shop_id: string | null;
  created_at?: string;
}

export interface SteadEvent {
  id?: number;
  shop_id: string;
  owner_id?: string | null;
  notification_type?: string;
  invoice?: string;
  consignment_id?: string;
  status?: string;
  cod_amount?: number;
  delivery_charge?: number;
  tracking_message?: string;
  provider_updated_at?: string;
  ts?: number;
}

export interface FraudCourier {
  name: string;
  orders: number;
  delivered: number;
  cancelled: number;
  rate: number;
  rating?: string;
}

export interface FraudReport {
  total: number;
  delivered: number;
  cancelled: number;
  rate: number;
  couriers: FraudCourier[];
  reports: Array<{ title: string; detail: string }>;
  risk_verdict: {
    level: string;
    label: string;
    action: string;
    color: string;
    reasons: string[];
  } | null;
  source: string;
  portalNote?: string;
}
