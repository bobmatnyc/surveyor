'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  Settings, 
  Home,
  FileText,
  TrendingUp,
  UserCheck,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Download
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    current: true,
  },
  {
    name: 'Survey Builder',
    href: '/admin/surveys/create',
    icon: ClipboardList,
    current: false,
  },
  {
    name: 'Survey Management',
    href: '/admin/surveys',
    icon: FileText,
    current: false,
  },
  {
    name: 'Results & Downloads',
    href: '/admin/results',
    icon: Download,
    current: false,
  },
];

const bottomNavigation = [
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Surveyor</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 h-5 w-5 transition-colors",
                  active ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                  collapsed ? "mr-0" : "mr-3"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <Separator className="my-4" />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5 transition-colors",
                    active ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                    collapsed ? "mr-0" : "mr-3"
                  )}
                />
                {!collapsed && <span className="flex-1">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center space-x-3",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-gray-600" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@surveyor.com</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}