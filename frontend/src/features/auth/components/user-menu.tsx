'use client';

/**
 * User Menu Component
 *
 * Displays user avatar with dropdown menu for account actions.
 * Shows login button when not authenticated.
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n-context';
import { User, LogOut, Settings, BarChart3 } from 'lucide-react';
import { isAdminEmail } from '@/lib/admin';

export function UserMenu() {
  const { locale, section } = useI18n();
  const auth = section('auth') as Record<string, string>;
  const { user, isLoading, logout } = useAuth();

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  // Not logged in - show login button
  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/${locale}/auth/login`}>{auth.login}</Link>
      </Button>
    );
  }

  // Get initials for avatar fallback
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user.displayName && (
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {auth.dashboard}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/settings`} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            {auth.settings}
          </Link>
        </DropdownMenuItem>
        {isAdminEmail(user.email) && (
          <DropdownMenuItem asChild>
            <Link href="/admin/metrics" className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              {locale === 'en' ? 'Analytics' : 'Analíticas'}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
