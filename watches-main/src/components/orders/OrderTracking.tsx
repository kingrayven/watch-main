import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, RefreshCw, Plus } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import OrderCard from "./OrderCard";
import OrderDetails from "./OrderDetails";
import { Order, OrderStatus } from "../../types/order";

const OrderTracking = () => {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getKanbanOrders = (): Order[] => {
    return orders.filter(order => order.status !== "cancelled");
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setIsUpdating(true);
      setOrders(prev => prev.map(order => 
        order.order_id === orderId ? { ...order, status: newStatus } : order
      ));
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed');
      setOrders(prev => prev.map(order => 
        order.order_id === orderId ? { ...order, status: orders.find(o => o.order_id === orderId)?.status || order.status } : order
      ));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete order');
      setOrders(prev => prev.filter(order => order.order_id !== orderId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="order-tracking-container">
      <div className="header-container">
        <h1 className="page-title">Order Management</h1>
        <div className="controls-container">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search orders..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`refresh-icon ${isLoading ? 'spin-animation' : ''}`} />
            Refresh
          </Button>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="main-card">
        <CardHeader>
          <div className="card-header-container">
            <CardTitle>
              {viewMode === "kanban" ? "Order Tracking Board" : "Order List"}
            </CardTitle>
            <div className="card-actions">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`small-refresh-icon ${isLoading ? 'spin-animation' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === "kanban" ? (
            <KanbanBoard 
              orders={getKanbanOrders()} 
              onOrderMove={handleStatusUpdate}
              onOrderClick={(order) => setSelectedOrder(order)}
              isUpdating={isUpdating}
            />
          ) : (
            <div className="orders-grid">
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onViewDetails={() => setSelectedOrder(order)}
                  onUpdateStatus={handleStatusUpdate}
                  onDelete={order.status === "delivered" ? 
                    () => handleDeleteOrder(order.order_id) : undefined
                  }
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetails
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onSaveChanges={async (status, notes) => {
            await handleStatusUpdate(selectedOrder.order_id, status);
            setSelectedOrder(null);
          }}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default OrderTracking;