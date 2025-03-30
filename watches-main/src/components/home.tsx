import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import Overview from "./dashboard/Overview";
import ProductManagement from "./products/ProductManagement";
import DeliveryAssignment from "./delivery/DeliveryAssignment";
import OrderTracking from "./orders/OrderTracking";
import AnalyticsOverview from "./analytics/AnalyticsOverview";

const Home = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/products" element={<ProductManagement />} />
        <Route path="/delivery" element={<DeliveryAssignment />} />
        <Route path="/orders" element={<OrderTracking />} />
        <Route path="/analytics" element={<AnalyticsOverview />} />
        
        <Route
          path="/settings"
          element={
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p className="text-gray-600">
                System settings and configuration options will appear here.
              </p>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Home;
