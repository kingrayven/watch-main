import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DollarSign, Clock, Truck, Star, Plus, RefreshCw } from "lucide-react";
import "./delivery.css";

interface DeliveryService {
  service_id: string;
  name: string;
  price: number;
  estimated_days: string;
  rating?: number;
  is_available: boolean;
  image_url?: string;
}

interface DeliveryServiceListProps {
  services: DeliveryService[];
  onServiceSelect: (service: DeliveryService) => void;
  onRefresh: () => Promise<void>;
  loading: boolean;
  onAddService?: () => void;
}

const DeliveryServiceList = ({
  services,
  onServiceSelect,
  onAddService,
  onRefresh,
  loading = false,
}: DeliveryServiceListProps) => {
  const handleDragStart = (service: DeliveryService, event: React.DragEvent) => {
    if (!service.is_available) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/json', JSON.stringify(service));
  };

  const handleRefresh = async () => {
    await onRefresh();
  };

  const handleServiceSelect = (service: DeliveryService) => {
    if (service.is_available) {
      onServiceSelect(service);
    }
  };

  return (
    <div className="delivery-service-list bg-[#2E2E2E] p-4 rounded-lg shadow-sm h-full overflow-auto border border-[#800020]/30">
      <div className="header mb-4 flex justify-between items-center">
        <div className="titles">
          <h2 className="text-xl font-bold text-[#F8F8F8]">Available Delivery Services</h2>
          <p className="text-sm text-[#F8F8F8]/80">
            Drag a service to assign it to a product
          </p>
        </div>
        <div className="actions flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="refresh-btn bg-blue-600 hover:bg-blue-700 text-[#F8F8F8] border-blue-600 flex items-center gap-1"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </Button>
          {onAddService && (
            <Button
              variant="outline"
              size="sm"
              className="add-service-btn bg-purple-600 hover:bg-purple-700 text-[#F8F8F8] border-purple-600 flex items-center gap-1"
              onClick={onAddService}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Service</span>
            </Button>
          )}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="empty-state text-center py-8">
          <p className="text-[#F8F8F8]/70">No delivery services available</p>
          {onAddService && (
            <Button
              variant="outline"
              className="mt-4 bg-[#800020] text-[#F8F8F8] hover:bg-[#700018] border-[#800020]"
              onClick={onAddService}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </Button>
          )}
        </div>
      ) : (
        <div className="services-list space-y-4">
          {services.map((service) => (
            <Card
              key={service.service_id}
              className={`service-card cursor-grab bg-[#3E3E3E] border-[#800020]/30 hover:border-[#800020]/50 transition-colors ${
                !service.is_available ? "opacity-60 cursor-not-allowed" : ""
              }`}
              draggable={service.is_available}
              onDragStart={(e) => handleDragStart(service, e)}
              onClick={() => handleServiceSelect(service)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={service.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.service_id}`}
                      alt={service.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.service_id}`;
                      }}
                    />
                    <CardTitle className="text-base text-[#F8F8F8]">
                      {service.name}
                    </CardTitle>
                  </div>
                  {!service.is_available && (
                    <Badge className="unavailable-badge bg-[#800020]/50 text-[#F8F8F8]">
                      Unavailable
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="service-details grid grid-cols-2 gap-2">
                  <div className="price flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-[#F8F8F8]/80" />
                    <span className="text-sm font-medium text-[#F8F8F8]">
                      ₱{service.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="time flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[#F8F8F8]/80" />
                    <span className="text-sm text-[#F8F8F8]">
                      {service.estimated_days} days
                    </span>
                  </div>
                  <div className="type flex items-center gap-1">
                    <Truck className="h-4 w-4 text-[#F8F8F8]/80" />
                    <span className="text-sm text-[#F8F8F8]">Delivery</span>
                  </div>
                  <div className="rating flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-[#F8F8F8]">
                      {service.rating || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="select-btn w-full bg-[#800020] text-[#F8F8F8] hover:bg-[#700018] hover:text-[#F8F8F8] border-[#800020]"
                  disabled={!service.is_available || loading}
                >
                  Select Service
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryServiceList;