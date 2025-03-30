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
  delivery_service_id?: string;
  delivery_service?: DeliveryService;
}

// For DeliveryServiceList component
export interface DeliveryServiceListProps {
  services: DeliveryService[];
  onServiceSelect?: (service: DeliveryService) => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

// For ProductDeliveryList component
export interface ProductDeliveryListProps {
  products: Product[];
  onAssignDelivery: (productId: string, service: DeliveryService) => Promise<void>;
  onRemoveDelivery: (productId: string) => Promise<void>;
}