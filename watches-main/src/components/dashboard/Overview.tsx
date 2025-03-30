import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SummaryCard from "./SummaryCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Package,
  Truck,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  customer: string;
  products: string[];
  total: number;
  status: string;
  date: string;
}

const Overview = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      pendingDeliveries: 0,
    },
    recentOrders: [] as Order[],
    salesData: [] as Array<{name: string, value: number}>,
    loading: true,
    error: null as string | null
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setDashboardData(prev => ({...prev, loading: true, error: null}));
      
      const [summaryRes, ordersRes, salesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/summary`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/orders/recent`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/analytics/sales`, { credentials: "include" })
      ]);

      if (!summaryRes.ok) throw new Error("Failed to fetch summary data");
      if (!ordersRes.ok) throw new Error("Failed to fetch orders data");
      if (!salesRes.ok) throw new Error("Failed to fetch sales data");

      const [summary, orders, sales] = await Promise.all([
        summaryRes.json(),
        ordersRes.json(),
        salesRes.json()
      ]);

      setDashboardData({
        summary: summary.data || summary,
        recentOrders: orders.data || orders,
        salesData: sales.data || sales,
        loading: false,
        error: null
      });
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data"
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownloadReport = () => {
    const { summary, recentOrders } = dashboardData;
    const blob = new Blob([
      `Luxury Watch Store Report\n\nSummary:\n` +
      `Total Orders: ${summary.totalOrders}\n` +
      `Watch Models: ${summary.totalProducts}\n` +
      `Total Revenue: ₱${summary.totalRevenue.toLocaleString()}\n` +
      `Pending Shipments: ${summary.pendingDeliveries}\n\n` +
      `Recent Orders:\n` +
      recentOrders.map(o => `${o.id}: ${o.customer} - ₱${o.total.toLocaleString()} (${o.status}) - ${o.products.join(", ")}`)
        .join("\n")
    ], { type: "text/plain" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watch_store_report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredOrders = dashboardData.recentOrders.filter(order => {
    switch(activeTab) {
      case "all": return true;
      case "pending": return order.status === "pending";
      case "processing": return ["preparing", "processing"].includes(order.status);
      case "delivered": return order.status === "delivered";
      case "out for delivery": return order.status === "out for delivery";
      default: return true;
    }
  });

  const summaryCards = [
    {
      title: "Total Orders",
      value: dashboardData.summary.totalOrders,
      icon: <ShoppingCart className="h-6 w-6" />,
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: "Watch Models",
      value: dashboardData.summary.totalProducts,
      icon: <Package className="h-6 w-6" />,
      trend: { value: 5.2, isPositive: true }
    },
    {
      title: "Total Revenue",
      value: `₱${(dashboardData.summary.totalRevenue / 1000000).toFixed(1)}M`,
      icon: <DollarSign className="h-6 w-6" />,
      trend: { value: 18.7, isPositive: true }
    },
    {
      title: "Pending Shipments",
      value: dashboardData.summary.pendingDeliveries,
      icon: <Truck className="h-6 w-6" />,
      trend: { value: 3.1, isPositive: false }
    }
  ];

  const quickAccessItems = [
    {
      title: "Watch Inventory",
      description: "Manage your watch collection",
      buttonText: "View Watches",
      action: "products"
    },
    {
      title: "Shipping Management",
      description: "Manage watch shipments",
      buttonText: "Manage Shipping",
      action: "deliveries"
    },
    {
      title: "Order Tracking",
      description: "Track watch orders",
      buttonText: "View Orders",
      action: "orders"
    }
  ];

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "delivered": return "text-green-600";
      case "out for delivery": return "text-blue-600";
      case "processing":
      case "preparing": return "text-indigo-600";
      case "pending": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const SalesChart = ({ salesData }: { salesData: Array<{name: string, value: number}> }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Sales (₱)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.3} />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis 
                stroke="#888" 
                tickFormatter={(value) => `₱${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#ddd",
                  color: "#333",
                  borderRadius: "0.5rem"
                }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, "Sales"]}
                labelFormatter={(name) => `Day: ${name}`}
              />
              <Legend />
              <Bar dataKey="value" fill="#888" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const RecentOrders = ({ orders, getStatusColor }: { 
    orders: Order[], 
    getStatusColor: (status: string) => string 
  }) => (
    <div className="space-y-4">
      {orders.map((order) => (
        <div 
          key={order.id} 
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" 
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          <div>
            <p className="font-medium">{order.customer}</p>
            <p className="text-sm text-gray-600">
              {order.products.join(", ")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">₱{order.total.toLocaleString()}</p>
            <p className={`text-sm ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const QuickAccessCard = ({ 
    title, 
    description, 
    buttonText,
    action 
  }: { 
    title: string, 
    description: string, 
    buttonText: string,
    action: string
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button 
          className="w-full" 
          onClick={() => navigate(`/${action}`)}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  if (dashboardData.loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{dashboardData.error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Luxury Watch Dashboard</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleDownloadReport}
            className="w-1/2 md:w-auto"
          >
            Download Report
          </Button>
          <Button 
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="w-1/2 md:w-auto"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart salesData={dashboardData.salesData} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Watch Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="out for delivery">Shipping</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <RecentOrders 
                  orders={filteredOrders} 
                  getStatusColor={getStatusColor} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickAccessItems.map((item) => (
          <QuickAccessCard 
            key={item.title}
            {...item}
          />
        ))}
      </div>
    </div>
  );
};

export default Overview;