import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Order, OrderStatus, PaymentStatus } from "../../types/order";

interface OrderDetailsProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  onSaveChanges?: (status: OrderStatus, notes: string) => Promise<void>;
  onContactCustomer?: () => void;
  isLoading?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  open = false,
  onClose = () => {},
  order,
  onSaveChanges = async () => {},
  onContactCustomer,
  isLoading = false,
}) => {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [customerNotes, setCustomerNotes] = useState(order.notes || "");

  useEffect(() => {
    if (open) {
      setStatus(order.status);
      setCustomerNotes(order.notes || "");
    }
  }, [open, order]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "pending-status";
      case "processing": return "processing-status";
      case "shipped": return "shipped-status";
      case "delivered": return "delivered-status";
      case "cancelled": return "cancelled-status";
      default: return "default-status";
    }
  };

  const calculateTotal = () => {
    const itemsTotal = order.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    return (itemsTotal + (order.delivery_service?.price || 0)).toFixed(2);
  };

  const handleStatusChange = (value: OrderStatus) => {
    setStatus(value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomerNotes(e.target.value);
  };

  const handleContactCustomer = () => {
    if (onContactCustomer) {
      onContactCustomer();
    } else if (order.customer_email) {
      window.open(`mailto:${order.customer_email}`);
    }
  };

  const handleSaveChanges = async () => {
    await onSaveChanges(status, customerNotes);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="order-details-dialog">
        <DialogHeader>
          <div className="dialog-header-container">
            <DialogTitle className="dialog-title">
              Order Details
            </DialogTitle>
            <Badge className={`status-badge ${getStatusColor(status)}`}>
              {status}
            </Badge>
          </div>
          <div className="order-meta">
            Order #{order.order_number} • {formatDate(order.order_date)}
          </div>
        </DialogHeader>

        <div className="order-grid">
          {/* Customer Information */}
          <div className="customer-info-section">
            <h3 className="section-title">
              Customer Information
            </h3>
            <div className="customer-details">
              <div className="customer-avatar-container">
                <div className="customer-avatar">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.customer_name}`}
                    alt="Customer Avatar"
                    className="avatar-image"
                  />
                </div>
                <div className="customer-info">
                  <p className="customer-name">{order.customer_name}</p>
                  {order.customer_email && (
                    <div className="customer-email">
                      <Mail className="icon" />
                      <span>{order.customer_email}</span>
                    </div>
                  )}
                  <div className="customer-phone">
                    <Phone className="icon" />
                    <span>{order.customer_phone}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="delivery-address">
                <div className="address-container">
                  <MapPin className="icon" />
                  <div>
                    <p className="address-label">Delivery Address</p>
                    <p className="address-text">{order.customer_address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items-section">
            <h3 className="section-title">Order Items</h3>
            <div className="items-list">
              {order.items.map((item) => (
                <div
                  key={item.product_id}
                  className="order-item"
                >
                  <div className="item-image-container">
                    <img
                      src={item.image_url || `https://api.dicebear.com/7.x/icons/svg?seed=${item.name}`}
                      alt={item.name}
                      className="item-image"
                    />
                  </div>
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-quantity">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="item-price">
                    <p className="item-total">
                      ₱{(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                    <p className="item-unit-price">
                      ₱{item.unit_price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              {order.delivery_service && (
                <div className="delivery-service-row">
                  <div className="delivery-service-info">
                    <Truck className="icon" />
                    <span>{order.delivery_service.name}</span>
                  </div>
                  <span className="delivery-price">
                    ₱{order.delivery_service.price.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="order-total-row">
                <span>Total</span>
                <span>₱{calculateTotal()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery and Payment Information */}
        <div className="info-grid">
          <div className="delivery-info-section">
            <h3 className="section-title">
              Delivery Information
            </h3>
            <div className="delivery-details">
              <div className="delivery-service">
                <Truck className="icon" />
                <span>
                  {order.delivery_service?.name || "No delivery service selected"}
                </span>
              </div>
              <div className="delivery-time">
                <Clock className="icon" />
                <span>
                  {order.delivery_service 
                    ? `Estimated Time: ${order.delivery_service.estimated_days} days`
                    : "No delivery estimate"}
                </span>
              </div>
              <div className="order-date">
                <Calendar className="icon" />
                <span>Order Date: {formatDate(order.order_date)}</span>
              </div>
            </div>
          </div>

          <div className="payment-info-section">
            <h3 className="section-title">
              Payment Information
            </h3>
            <div className="payment-details">
              <div className="payment-method">
                <DollarSign className="icon" />
                <span>Payment Method: {order.payment_method || "Not specified"}</span>
              </div>
              <div className="payment-status">
                <div className="status-container">
                  <AlertCircle className="icon" />
                  <span>Payment Status: </span>
                </div>
                <Badge
                  variant={
                    order.payment_status === "paid"
                      ? "default"
                      : order.payment_status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                  className="status-badge"
                >
                  {order.payment_status || "pending"}
                </Badge>
              </div>
              <div className="total-items">
                <Package className="icon" />
                <span>
                  Total Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status and Notes */}
        <div className="action-grid">
          <div className="status-update-section">
            <h3 className="section-title">
              Update Order Status
            </h3>
            <Select 
              value={status} 
              onValueChange={handleStatusChange}
              disabled={isLoading}
            >
              <SelectTrigger className="status-select">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="status-options">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="notes-section">
            <h3 className="section-title">Admin Notes</h3>
            <Textarea
              placeholder="Add notes about this order..."
              value={customerNotes}
              onChange={handleNotesChange}
              className="notes-textarea"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="dialog-footer">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
          {order.customer_email && (
            <Button 
              variant="outline" 
              onClick={handleContactCustomer}
              disabled={isLoading}
              className="contact-button"
            >
              Contact Customer
            </Button>
          )}
          <Button 
            onClick={handleSaveChanges}
            disabled={isLoading}
            className="save-button"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetails;