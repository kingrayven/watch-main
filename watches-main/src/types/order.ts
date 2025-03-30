export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

export interface Order {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  items: OrderItem[];
  delivery_service?: {
    name: string;
    estimated_days: string;
    price: number;
  };
  payment_method?: string;
  payment_status?: PaymentStatus;
  notes?: string;
}