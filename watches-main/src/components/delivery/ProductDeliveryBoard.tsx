import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Clock, DollarSign, Truck, Package } from "lucide-react";
import "./delivery.css";

interface DeliveryService {
  service_id: string;
  name: string;
  price: number;
  estimated_days: string;
  is_available: boolean;
  image_url?: string;
}

interface Product {
  product_id: string;
  name: string;
  price: number;
  primary_image?: string;
  assignedDelivery?: DeliveryService;
}

interface ProductDeliveryBoardProps {
  products: Product[];
  onAssignDelivery: (productId: string, service: DeliveryService) => Promise<void>;
  onRemoveDelivery: (productId: string) => Promise<void>;
}

const ProductDeliveryBoard = ({
  products,
  onAssignDelivery,
  onRemoveDelivery
}: ProductDeliveryBoardProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [selectedDeliveryService, setSelectedDeliveryService] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignDelivery = async () => {
    if (!selectedProduct || !selectedDeliveryService || !deliveryPrice) return;

    try {
      setLoading(true);
      setError(null);
      
      const service = {
        service_id: selectedDeliveryService,
        name: selectedDeliveryService, // This should be replaced with actual service name
        price: parseFloat(deliveryPrice),
        estimated_days: estimatedTime,
        is_available: true
      };

      await onAssignDelivery(selectedProduct.product_id, service);
      
      resetForm();
    } catch (err) {
      setError('Failed to assign delivery service');
      console.error('Assignment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDelivery = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      await onRemoveDelivery(productId);
    } catch (err) {
      setError('Failed to remove delivery assignment');
      console.error('Removal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedDeliveryService("");
    setDeliveryPrice("");
    setEstimatedTime("");
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (product.assignedDelivery) {
      setSelectedDeliveryService(product.assignedDelivery.service_id);
      setDeliveryPrice(product.assignedDelivery.price.toString());
      setEstimatedTime(product.assignedDelivery.estimated_days);
    } else {
      setSelectedDeliveryService("");
      setDeliveryPrice("");
      setEstimatedTime("");
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading delivery data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-500 mb-2">Error loading data</h3>
        <p className="text-gray-300 mb-4">{error}</p>
        <Button 
          variant="default"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full">
      <h2 className="text-2xl font-bold mb-6 text-white">Product Delivery Assignment</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.product_id}
            className={`cursor-pointer transition-all bg-gray-800 border-gray-700 hover:border-primary ${
              selectedProduct?.product_id === product.product_id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleProductSelect(product)}
          >
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              <img
                src={product.primary_image || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
              {product.assignedDelivery && (
                <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
                  <Truck className="w-3 h-3 mr-1" />
                  <span>Delivery Assigned</span>
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-white">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-300 mb-2">
                <Package className="w-4 h-4 mr-2" />
                <span>₱{product.price.toFixed(2)}</span>
              </div>
              {product.assignedDelivery && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-300">
                    <Truck className="w-4 h-4 mr-2" />
                    <span>{product.assignedDelivery.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>₱{product.assignedDelivery.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{product.assignedDelivery.estimated_days}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProduct && (
        <div className="mt-8 p-6 border border-primary/30 rounded-lg bg-gray-800">
          <h3 className="text-xl font-semibold mb-4 text-white">
            {selectedProduct.assignedDelivery
              ? `Edit Delivery for ${selectedProduct.name}`
              : `Assign Delivery for ${selectedProduct.name}`}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="delivery-service" className="text-gray-300">
                Delivery Service
              </Label>
              <Select
                value={selectedDeliveryService}
                onValueChange={setSelectedDeliveryService}
              >
                <SelectTrigger
                  id="delivery-service"
                  className="w-full mt-1 bg-gray-700 text-white border-gray-600"
                >
                  <SelectValue placeholder="Select a delivery service" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {selectedProduct.assignedDelivery && (
                    <SelectItem
                      value={selectedProduct.assignedDelivery.service_id}
                      className="hover:bg-gray-700"
                    >
                      {selectedProduct.assignedDelivery.name} ({selectedProduct.assignedDelivery.estimated_days})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delivery-price" className="text-gray-300">
                Delivery Price (₱)
              </Label>
              <Input
                id="delivery-price"
                type="number"
                placeholder="0.00"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                className="mt-1 bg-gray-700 text-white border-gray-600"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="estimated-time" className="text-gray-300">
                Estimated Delivery Time
              </Label>
              <Input
                id="estimated-time"
                placeholder="e.g. 1-2 days, Same day, etc."
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="mt-1 bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {selectedProduct.assignedDelivery && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleRemoveDelivery(selectedProduct.product_id);
                  resetForm();
                }}
                disabled={loading}
              >
                Remove Delivery
              </Button>
            )}
            <Button
              onClick={handleAssignDelivery}
              disabled={!selectedDeliveryService || !deliveryPrice || loading}
            >
              {selectedProduct.assignedDelivery
                ? "Update Delivery"
                : "Assign Delivery"}
            </Button>
            <Button
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-700"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDeliveryBoard;