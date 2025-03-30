import React from "react";
import { Clock, Package, User, MapPin, Phone, DollarSign } from "lucide-react";
import { Order, OrderStatus } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onViewDetails?: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  onDelete?: (orderId: string) => Promise<void>;
  isUpdating?: boolean;
}

const OrderCard = ({
  order,
  onViewDetails = () => {},
  onUpdateStatus = async () => {},
  onDelete,
  isUpdating = false
}: OrderCardProps) => {
  const statusClasses: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case "pending": return "processing";
      case "processing": return "shipped";
      case "shipped": return "delivered";
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  const handleStatusUpdate = async () => {
    if (nextStatus) {
      await onUpdateStatus(order.order_id, nextStatus);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(order.order_id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[order.status]}`}>
            {formatStatus(order.status)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
          <Clock size={14} />
          <span>{formatDate(order.order_date)}</span>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <User size={16} className="text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">{order.customer_name}</p>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Phone size={14} />
                <span>{order.customer_phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-500 mt-0.5" />
            <p className="text-gray-600 text-sm">{order.customer_address}</p>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <Package size={16} className="text-gray-500" />
              <p className="font-medium">Order Items ({order.items.length})</p>
            </div>
            <div className="ml-6 space-y-1 max-h-24 overflow-y-auto">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-500">
                    ₱{item.unit_price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 font-medium">
              <div className="flex items-center gap-1">
                <DollarSign size={16} className="text-gray-500" />
                <span>Total</span>
              </div>
              <span>₱{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between gap-2">
          <button
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            onClick={onViewDetails}
            disabled={isUpdating}
          >
            View Details
          </button>
          {onDelete && (
            <button
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              Delete
            </button>
          )}
          <button
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStatusUpdate}
            disabled={!nextStatus || isUpdating}
          >
            {isUpdating ? "Processing..." : 
             nextStatus ? `Mark as ${formatStatus(nextStatus)}` : 
             order.status === "delivered" ? "Completed" : "Cancelled"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;