export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  buy_price: number;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
  category: string | null;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  barcode?: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockThreshold?: number;
  category?: string;
  imageUri?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  total_debt: number;
  created_at: string;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
}

export interface Sale {
  id: number;
  customer_id: number | null;
  total_amount: number;
  discount: number;
  amount_paid: number;
  change_given: number;
  note: string | null;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
  barcode?: string;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  buyPrice: number;
}

export interface SaleFormData {
  customerId?: number;
  totalAmount: number;
  discount?: number;
  amountPaid: number;
  changeGiven?: number;
  note?: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    buyPrice: number;
  }[];
  isDebt?: boolean;
  debtAmount?: number;
}

export interface Debt {
  id: number;
  customer_id: number;
  sale_id: number | null;
  original_amount: number;
  paid_amount: number;
  remaining: number;
  is_paid: number;
  created_at: string;
  paid_at: string | null;
  customer_name?: string;
  customer_phone?: string;
}

export interface Expense {
  id: number;
  label: string;
  amount: number;
  category: string | null;
  created_at: string;
}

export interface ExpenseFormData {
  label: string;
  amount: number;
  category?: string;
}

export interface DailyStats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  lowStockCount: number;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  transactions: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  debtSummary: { totalOutstanding: number; customersWithDebt: number };
}

export type SubscriptionTier = 'free' | 'basic' | 'pro';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  isTrial: boolean;
  expirationDate: string | null;
}

export type ProductCategory = 'Food' | 'Clothing' | 'Electronics' | 'Other' | string;

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface SupplierFormData {
  name: string;
  phone?: string;
  address?: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  supplier_name?: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrderFormData {
  supplierId: number;
  items: { productId: number; productName: string; quantity: number; unitCost: number; subtotal: number }[];
}

export interface ReturnSale {
  id: number;
  sale_id: number;
  total_amount: number;
  reason: string | null;
  created_at: string;
  original_total?: number;
}

export interface ReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
