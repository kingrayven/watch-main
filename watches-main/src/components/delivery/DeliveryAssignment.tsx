import React, { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import DeliveryServiceList from "./DeliveryServiceList";
import ProductDeliveryBoard from "./ProductDeliveryBoard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Info, Truck, AlertCircle, RefreshCw } from "lucide-react";

interface DeliveryService {
  service_id: string;
  name: string;
  price: number;
  estimated_days: string;
  rating?: number;
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

const DeliveryAssignment = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<DeliveryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, servicesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/delivery-services`, { credentials: 'include' })
        ]);

        if (!productsRes.ok || !servicesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const productsData = await productsRes.json();
        const servicesData = await servicesRes.json();

        setProducts(productsData);
        setServices(servicesData);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleAssignDelivery = async (productId: string, service: DeliveryService) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/delivery/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          delivery_service_id: service.service_id,
          assigned_by: '1'
        }),
      });

      if (!response.ok) throw new Error('Assignment failed');

      setProducts(prev => prev.map(p => 
        p.product_id === productId ? { ...p, assignedDelivery: service } : p
      ));

      setAlertMessage(`${service.name} assigned successfully!`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      console.error('Assignment error:', err);
      setError('Failed to assign delivery service');
      setAlertMessage('Failed to assign delivery service');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDelivery = async (productId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/delivery/assignments/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Removal failed');

      setProducts(prev => prev.map(p => 
        p.product_id === productId ? { ...p, assignedDelivery: undefined } : p
      ));

      setAlertMessage("Delivery service removed successfully");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      console.error('Removal error:', err);
      setError('Failed to remove delivery service');
      setAlertMessage('Failed to remove delivery service');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: DeliveryService) => {
    console.log("Service selected:", service);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/delivery-services`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Refresh failed');
      
      const data = await response.json();
      setServices(data);
      setAlertMessage("Services refreshed successfully");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      setError('Failed to refresh services');
      setAlertMessage('Failed to refresh services');
      setShowAlert(true);
      console.error('Refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStats = () => {
    const totalProducts = products.length;
    const assignedProducts = products.filter(p => p.assignedDelivery).length;
    const unassignedProducts = totalProducts - assignedProducts;

    return { totalProducts, assignedProducts, unassignedProducts };
  };

  const stats = getAssignmentStats();

  if (loading && products.length === 0 && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {showAlert && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Delivery Service Assignment</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Help
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Assigned Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.assignedProducts}
                </div>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  {Math.round((stats.assignedProducts / stats.totalProducts) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Unassigned Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-amber-600">
                  {stats.unassignedProducts}
                </div>
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  {Math.round((stats.unassignedProducts / stats.totalProducts) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="board" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Assignment Board
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Delivery Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-4">
            <DragDropContext onDragEnd={() => {}}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <DeliveryServiceList
                    services={services}
                    onServiceSelect={handleServiceSelect}
                    onRefresh={handleRefresh}
                    loading={loading}
                  />
                </div>
                <div className="lg:col-span-3">
                  <ProductDeliveryBoard
                    products={products}
                    onAssignDelivery={handleAssignDelivery}
                    onRemoveDelivery={handleRemoveDelivery}
                  />
                </div>
              </div>
            </DragDropContext>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Available Delivery Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {services.map(service => (
                    <Card
                      key={service.service_id}
                      className={`${!service.is_available ? "opacity-60" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={service.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.service_id}`}
                            alt={service.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <CardTitle className="text-base">
                            {service.name}
                          </CardTitle>
                        </div>
                        {!service.is_available && (
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Price:</span>
                            <span className="font-medium">
                              ₱{service.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Time:</span>
                            <span>{service.estimated_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Rating:</span>
                            <span className="flex items-center">
                              {service.rating || "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryAssignment;