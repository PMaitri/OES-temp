import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Bell } from "lucide-react";

export function AppNavbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleBadgeVariant = () => {
    if (user.role === "admin") return "default";
    if (user.role === "teacher") return "secondary";
    return "outline";
  };

  const getRoleLabel = () => {
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <nav className="border-b bg-background h-16 flex items-center px-4 md:px-6 lg:px-8">
      <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${user.role}/dashboard`}>
            <h1 className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity">
              School Assessment System
            </h1>
          </Link>
          <Badge variant={getRoleBadgeVariant()} data-testid="badge-role">
            {getRoleLabel()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden md:inline">{user.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem data-testid="menuitem-profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem data-testid="menuitem-settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="menuitem-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
