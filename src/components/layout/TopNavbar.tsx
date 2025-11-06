import { useState, useEffect } from "react";
import { Search, Bell, Plus, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { subscribeToUnreadCount } from "@/lib/firestoreNotifications";
import { toast } from "sonner";

export const TopNavbar = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  
  useEffect(() => {
    const userId = currentUser?.uid || "admin";
    const unsubscribe = subscribeToUnreadCount(userId, setUnreadCount);
    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoggingOut(false);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Admin';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSchoolName = () => {
    return userProfile?.schoolName || localStorage.getItem('school_name') || 'SmartSchool';
  };

  return (
    <header className="h-16 border-b border-border bg-card shadow-level-1">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + School Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-lg"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">DPS</span>
            </div>
            {/* School Info */}
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {getSchoolName()}
              </h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students, admission no..."
              className="pl-10 bg-muted/50 border-0 h-10 rounded-lg"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Add Student */}
          <Button
            onClick={() => navigate("/admission/student-info")}
            className="hidden sm:flex gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 rounded-lg h-10"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Student</span>
          </Button>
          {/* Mobile icon-only */}
          <Button
            onClick={() => navigate("/admission/student-info")}
            size="icon"
            className="sm:hidden bg-accent hover:bg-accent/90 text-accent-foreground shadow-level-2 rounded-lg h-10 w-10"
            aria-label="Add Student"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-lg"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white text-xs font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg bg-card text-card-foreground border shadow-level-3 z-50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email || currentUser?.email || 'admin@school.com'}
                  </p>
                  {userProfile?.role && (
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userProfile.role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
