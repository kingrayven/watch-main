import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ChartContainer from "./ChartContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
}

const AnalyticsOverview = () => {
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [productDistributionData, setProductDistributionData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<MetricCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sales");

  const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Fetch analytics summary data
  const fetchSummaryMetrics = async () => {
    try {
      const response = await fetch("/api/analytics/summary");
      if (!response.ok) throw new Error("Failed to fetch summary");
      const data = await response.json();
      
      setMetrics([
        {
          title: "Total Orders",
          value: formatNumber(data.data.totalOrders),
          change: data.data.growthMetrics.orders,
          trend: data.data.growthMetrics.orders >= 0 ? "up" : "down"
        },
        {
          title: "Total Revenue",
          value: `$${formatNumber(data.data.totalRevenue)}`,
          change: data.data.growthMetrics.revenue,
          trend: data.data.growthMetrics.revenue >= 0 ? "up" : "down"
        },
        {
          title: "Total Products",
          value: formatNumber(data.data.totalProducts),
          change: data.data.growthMetrics.products,
          trend: data.data.growthMetrics.products >= 0 ? "up" : "down"
        },
        {
          title: "Pending Deliveries",
          value: data.data.pendingDeliveries.toString(),
          change: -2.1, // This would come from API in a real scenario
          trend: "down"
        }
      ]);
    } catch (error) {
      console.error("Error fetching summary metrics:", error);
    }
  };

  // Fetch sales data
  const fetchSalesData = async (timeframe = "7days") => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/sales?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch sales data");
      const data = await response.json();
      
      const formattedData = data.data.map((item: any) => ({
        date: item.date,
        orders: item.orders_count,
        revenue: item.revenue,
        avgOrderValue: item.average_order_value
      }));
      
      setDailySalesData(formattedData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product distribution data
  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();
      
      // Group by category
      const categoryMap: Record<string, {name: string, value: number}> = {};
      products.data.forEach((product: any) => {
        const categoryName = product.category_name || 'Uncategorized';
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = { name: categoryName, value: 0 };
        }
        categoryMap[categoryName].value += product.stock_quantity;
      });
      
      setProductDistributionData(Object.values(categoryMap));
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch service data
  const fetchServiceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/delivery-services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const services = await response.json();
      
      const formattedData = services.data.map((service: any) => ({
        name: service.name,
        orders: service.order_count,
        onTime: Math.floor(Math.random() * 30) + 70, // Replace with real data
        delayed: Math.floor(Math.random() * 30) // Replace with real data
      }));
      
      setServiceData(formattedData);
    } catch (error) {
      console.error("Error fetching service data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryMetrics();
    fetchSalesData();
    fetchProductData();
    fetchServiceData();
  }, []);

  const handleExport = (type: "csv" | "pdf" | "print") => {
    // Implement actual export logic here
    switch (type) {
      case "csv":
        alert(`Exporting ${activeTab} data as CSV...`);
        break;
      case "pdf":
        alert(`Exporting ${activeTab} data as PDF...`);
        break;
      case "print":
        window.print();
        break;
    }
  };

  const handleFilterChange = (value: string) => {
    if (activeTab === "sales") {
      fetchSalesData(value);
    }
    // Add other tab-specific filter handling if needed
  };

  const MetricCard = ({ title, value, change, trend }: MetricCardProps) => (
    <Card className="bg-[#1E1E1E] border-[#333]">
      <CardContent className="p-4">
        <p className="text-sm text-[#AAA]">{title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-2xl font-bold text-[#F0F0F0]">{value}</p>
          <div className={`flex items-center text-sm ${
            trend === "up" ? "text-[#4CAF50]" : "text-[#E15759]"
          }`}>
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-[#121212] min-h-screen">
      <h1 className="text-3xl font-bold text-[#F0F0F0]">Watch Store Analytics</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Section */}
      <Tabs 
        defaultValue="sales" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="flex w-full bg-[#1E1E1E] border border-[#333] p-1 rounded-lg gap-1">
          <TabsTrigger 
            value="sales" 
            className="flex-1 py-2 px-4 text-sm font-medium text-[#E0E0E0] hover:bg-[#2A2A2A] data-[state=active]:bg-[#333] data-[state=active]:text-white data-[state=active]:font-semibold rounded-md transition-colors"
          >
            Sales Performance
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex-1 py-2 px-4 text-sm font-medium text-[#E0E0E0] hover:bg-[#2A2A2A] data-[state=active]:bg-[#333] data-[state=active]:text-white data-[state=active]:font-semibold rounded-md transition-colors"
          >
            Product Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="service" 
            className="flex-1 py-2 px-4 text-sm font-medium text-[#E0E0E0] hover:bg-[#2A2A2A] data-[state=active]:bg-[#333] data-[state=active]:text-white data-[state=active]:font-semibold rounded-md transition-colors"
          >
            Service Metrics
          </TabsTrigger>
        </TabsList>

        {/* Sales Chart */}
        <TabsContent value="sales" className="mt-4">
          <ChartContainer 
            title="Daily Sales Performance" 
            onExport={handleExport}
            onFilterChange={handleFilterChange}
            filterOptions={[
              { label: "Last 7 days", value: "7days" },
              { label: "Last 30 days", value: "30days" },
              { label: "Last 90 days", value: "90days" },
            ]}
          >
            {dailySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#E0E0E0" />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2A2A',
                      borderColor: '#444',
                      color: '#F0F0F0',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="orders" 
                    fill="#4E79A7" 
                    name="Orders"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#59A14F" 
                    name="Revenue ($)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {isLoading ? "Loading sales data..." : "No sales data available"}
              </div>
            )}
          </ChartContainer>
        </TabsContent>

        {/* Products Chart */}
        <TabsContent value="products" className="mt-4">
          <ChartContainer 
            title="Product Distribution by Category" 
            onExport={handleExport}
          >
            {productDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={productDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {productDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2A2A',
                      borderColor: '#444',
                      color: '#F0F0F0',
                      borderRadius: '4px'
                    }}
                    formatter={(value, name, props) => [
                      `${value} units`,
                      props.payload.name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {isLoading ? "Loading product data..." : "No product data available"}
              </div>
            )}
          </ChartContainer>
        </TabsContent>

        {/* Service Chart */}
        <TabsContent value="service" className="mt-4">
          <ChartContainer 
            title="Delivery Service Performance" 
            onExport={handleExport}
          >
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={serviceData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" stroke="#E0E0E0" />
                  <YAxis dataKey="name" type="category" stroke="#E0E0E0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2A2A',
                      borderColor: '#444',
                      color: '#F0F0F0',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="orders" 
                    fill="#4E79A7" 
                    name="Total Orders"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="onTime" 
                    fill="#59A14F" 
                    name="On-Time %"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {isLoading ? "Loading service data..." : "No service data available"}
              </div>
            )}
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsOverview;