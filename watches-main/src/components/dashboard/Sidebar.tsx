import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./dash.css";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface UserData {
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  userData?: UserData; // Changed to match DashboardLayout's type
}

const Sidebar = ({ collapsed = false, onToggle, userData }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/",
    },
    {
      title: "Product Management",
      icon: <Package className="h-5 w-5" />,
      path: "/products",
    },
    {
      title: "Delivery Assignment",
      icon: <Truck className="h-5 w-5" />,
      path: "/delivery",
    },
    {
      title: "Order Tracking",
      icon: <ClipboardList className="h-5 w-5" />,
      path: "/orders",
    },
    {
      title: "Analytics Overview",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/analytics",
    },
    {
      title: "User Watch Store",
      icon: <Users className="h-5 w-5" />,
      path: "/user-store",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#0A192F] border-r border-[#C0C0C0]/20 transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#C0C0C0]/20">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-[#C0C0C0]" />
            <h1 className="text-xl font-bold text-[#EAEAEA]">DeliverEase</h1>
          </div>
        ) : (
          <div className="mx-auto">
            <Truck className="h-8 w-8 text-[#C0C0C0]" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 text-[#C0C0C0] hover:bg-[#0A2458] hover:text-[#EAEAEA]",
            collapsed ? "mx-auto" : ""
          )}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <TooltipProvider>
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors no-underline",
                        currentPath === item.path
                          ? "bg-[#0A2458] text-[#C0C0C0]"
                          : "text-[#C0C0C0] hover:bg-[#0A2458]/50",
                        collapsed && "justify-center"
                      )}
                    >
                      {React.cloneElement(item.icon, { className: "h-5 w-5 text-[#C0C0C0]" })}
                      {!collapsed && <span className="text-[#EAEAEA]">{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-[#0A2458] text-[#EAEAEA] border border-[#C0C0C0]/20">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </nav>

      <div className="p-4 border-t border-[#C0C0C0]/20">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center gap-3 text-red-400 hover:bg-red-400/10 hover:text-red-300 no-underline",
                  collapsed && "justify-center"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                {!collapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-[#0A2458] text-[#EAEAEA] border border-[#C0C0C0]/20">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};

export default Sidebar;