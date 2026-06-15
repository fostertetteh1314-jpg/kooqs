export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  slug: string;
  order: number;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string | null;
  categoryId: string;
  category?: Category;
  available: boolean;
  featured: boolean;
  spicy: boolean;
  vegetarian: boolean;
  calories?: number | null;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderType: "delivery" | "pickup";
  address?: string | null;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string | null;
  estimatedTime?: number | null;
  email?: string | null;
  paystackRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface CheckoutFormData {
  customerName: string;
  phone: string;
  orderType: "delivery" | "pickup";
  address?: string;
  notes?: string;
}

export interface AnalyticsData {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalCustomers: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topItems: { name: string; count: number; revenue: number }[];
}
