import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "All Students", href: "/students", icon: Users },
  { name: "Add Student", href: "/admission/student-info", icon: UserPlus },
  { name: "Teachers", href: "/teachers", icon: GraduationCap },
  { name: "Exams & Marks", href: "/exams", icon: BookOpen },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Fee Management", href: "/fees", icon: DollarSign },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handleToggleMobile = () => {
      setMobileOpen(true);
    };

    window.addEventListener('toggle-mobile-sidebar', handleToggleMobile);

    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggleMobile);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/60 dark:border-gray-700/60">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-lg text-gray-900 dark:text-white truncate">
                {localStorage.getItem("school_name") || "SmartSchool"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Admin Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Navigation - Fit All Items Without Scroll */}
      <div className="flex-1 px-4 py-4 flex flex-col justify-center">
        <nav className="space-y-1.5">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              onClick={() => { if (mobileOpen) closeMobile(); }}
              className={function({ isActive }: { isActive: boolean }) {
                return cn(
                  // Base layout - compact height for better fit
                  "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-out",
                  // Default state
                  "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
                  "hover:bg-gray-100/70 dark:hover:bg-gray-800/50",
                  // Active state
                  isActive && "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50",
                  // Focus state
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
                  // Collapsed state
                  collapsed && "justify-center px-3"
                );
              }}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                location.pathname === item.href 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">v1.0.0</span>
            <span>Student Management</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex border-r flex-col transition-all duration-150 ease-out relative",
          "bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn(
            "absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border shadow-md",
            "bg-background hover:bg-muted border-border",
            "transition-colors duration-75 ease-out"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-out lg:hidden",
          "bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-800",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobile}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <SidebarContent />
      </aside>
    </>
  );
};

// Export mobile trigger for use in header/navbar
export const MobileSidebarTrigger = ({ className }: { className?: string }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMobileOpen(true)}
      className={cn("lg:hidden", className)}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};
