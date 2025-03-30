import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
}

interface SalesData {
  date: string;
  orders_count: number;
  revenue: number;
}

interface ProductData {
  name: string;
  value: number;
}

const AnalyticsOverview = () => {
  const [metrics, setMetrics] = useState<MetricCardProps[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState({
    summary: true,
    sales: true,
    products: true
  });
  const [error, setError] = useState<string | null>(null);

  // Original color scheme preserved
  const COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"];

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading({ summary: true, sales: true, products: true });

      const [summaryRes, salesRes, productsRes] = await Promise.all([
        fetch("/api/analytics/summary"),
        fetch("/api/analytics/sales?timeframe=7days"),
        fetch("/api/products")
      ]);

      // Handle HTTP errors
      if (!summaryRes.ok) throw new Error("Failed to fetch summary data");
      if (!salesRes.ok) throw new Error("Failed to fetch sales data");
      if (!productsRes.ok) throw new Error("Failed to fetch products");

      const [summary, sales, products] = await Promise.all([
        summaryRes.json(),
        salesRes.json(),
        productsRes.json()
      ]);

      // Set metrics with peso sign
      setMetrics([
        {
          title: "Total Orders",
          value: summary.data.totalOrders.toString(),
          change: 12, // Calculate this from your actual data
          trend: "up"
        },
        {
          title: "Total Revenue",
          value: formatCurrency(summary.data.totalRevenue),
          change: 8.5,
          trend: "up"
        },
        {
          title: "Total Products",
          value: summary.data.totalProducts.toString(),
          change: 3.2,
          trend: "up"
        },
        {
          title: "Pending Deliveries",
          value: summary.data.pendingDeliveries.toString(),
          change: -2.1,
          trend: "down"
        }
      ]);

      // Set sales data with formatted tooltip
      setSalesData(sales.data.map(item => ({
        ...item,
        formattedRevenue: formatCurrency(item.revenue)
      })));

      // Process product data for pie chart
      const categoryMap: Record<string, number> = {};
      products.data.forEach((product: any) => {
        const category = product.category_name || "Uncategorized";
        categoryMap[category] = (categoryMap[category] || 0) + product.stock_quantity;
      });

      setProductData(Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
        formattedValue: value.toLocaleString()
      })));

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading({ summary: false, sales: false, products: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  if (error) {
    return (
      <div className="p-6 bg-[#121212] min-h-screen flex items-center justify-center">
        <Card className="bg-[#1E1E1E] border-[#333] p-6 text-center">
          <p className="text-[#E15759] mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#4E79A7] text-white rounded hover:bg-[#3A5F8A] transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

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
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="flex w-full bg-[#1E1E1E] border-[#333] p-1 rounded-lg gap-1">
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
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card className="bg-[#1E1E1E] border-[#333]">
            <CardContent className="p-6">
              {loading.sales ? (
                <div className="flex items-center justify-center h-80 text-[#AAA]">
                  Loading sales data...
                </div>
              ) : salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
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
                      formatter={(value, name) => {
                        if (name === 'Revenue') {
                          return [`${formatCurrency(Number(value))}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="orders_count" 
                      fill="#4E79A7" 
                      name="Orders"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#59A14F" 
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-[#AAA]">
                  No sales data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card className="bg-[#1E1E1E] border-[#333]">
            <CardContent className="p-6">
              {loading.products ? (
                <div className="flex items-center justify-center h-80 text-[#AAA]">
                  Loading product data...
                </div>
              ) : productData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {productData.map((_, index) => (
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
                      formatter={(value) => [`${value} units`, 'Stock Quantity']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-[#AAA]">
                  No product data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsOverview;