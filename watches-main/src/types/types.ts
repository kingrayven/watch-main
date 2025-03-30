// src/types.ts

// Delivery Types
export interface DeliveryService {
  service_id: string;
  name: string;
  price: number;
  estimated_days: string;
  rating?: number;
  is_available: boolean;
  image_url?: string;
}

export interface Product {
  product_id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  primary_image?: string;
  delivery_service_id?: string;
  delivery_service?: DeliveryService;
}

// Order Types
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
  delivery_service?: DeliveryService;
  payment_method?: string;
  payment_status?: PaymentStatus;
  notes?: string;
}

// Component Props
export interface DeliveryServiceListProps {
  services: DeliveryService[];
  onServiceSelect?: (service: DeliveryService) => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

export interface ProductDeliveryListProps {
  products: Product[];
  onAssignDelivery: (productId: string, service: DeliveryService) => Promise<void>;
  onRemoveDelivery: (productId: string) => Promise<void>;
}

export interface OrderManagementProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onDeliveryUpdate: (orderId: string, service: DeliveryService) => Promise<void>;
}