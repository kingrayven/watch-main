import React, { ReactNode, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import "./dash.css";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children?: ReactNode;
}

interface UserData {
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  email?: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState<UserData | undefined>(undefined); // Changed from null to undefined
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUserData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          profileImage: data.user.profileImage ? 
            `${API_BASE_URL}${data.user.profileImage}` : undefined,
          email: data.user.email
        });
      } else {
        throw new Error(data.message || "Invalid user data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error instanceof Error ? error.message : "Failed to load user data");
      if (error instanceof Error && error.message.includes("401")) {
        window.location.href = "/login";
      }
      setUserData(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="dashboard-container flex h-screen">
        <div className="main-content flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto">
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container flex h-screen">
        <div className="main-content flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto">
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="default"
                    className="px-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    className="px-4"
                    onClick={() => window.location.href = "/login"}
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container flex h-screen">
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle-btn"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <div
        className={`sidebar-container ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static md:translate-x-0 z-40 transition-transform duration-300 ease-in-out h-full`}
      >
        <Sidebar 
          collapsed={collapsed} 
          onToggle={() => setCollapsed(!collapsed)}
          userData={userData ? {
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            profileImage: userData.profileImage
          } : undefined}
        />
      </div>

      <div className={`main-content flex-1 overflow-auto p-4 md:p-6 lg:p-8 ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}>
        <div className="container mx-auto">
          {children ?? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center">
                <h2 className="welcome-heading text-2xl font-semibold mb-4">
                  Welcome {userData?.firstName ? `back, ${userData.firstName}` : "to the Dashboard"}
                </h2>
                <p className="welcome-text max-w-md mx-auto">
                  Select a section from the sidebar to manage your products,
                  delivery services, orders, or view analytics.
                </p>
                {userData?.role === "admin" && (
                  <p className="mt-2 text-sm text-gray-500">
                    You have administrator privileges
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-overlay fixed inset-0 z-30 md:hidden bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;