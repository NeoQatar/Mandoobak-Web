
'use client';
import { useState } from 'react';
import { Bell, Search, ChevronDown, X, LogOut, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import LanguageSwitcher from './language-switcher';
import { useLanguage } from '@/context/language-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

const translations = {
  en: {
    search: 'Search',
    logOut: 'Log Out',
    myAccount: 'My Account'
  },
  ar: {
    search: 'بحث',
    logOut: 'تسجيل خروج',
    myAccount: 'حسابي'
  },
};

export default function AppHeader() {
  const isMobile = useIsMobile();
  const [showSearch, setShowSearch] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const { dbUser, logout } = useAuth();

  if (isMobile && showSearch) {
    return (
      <header className="flex h-14 items-center justify-between px-4 bg-background border-b sticky top-0 z-10">
        <div className="flex items-center w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="pl-10 bg-muted border-none w-full"
              autoFocus
            />
          </div>
          <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(false)}
            >
              <X className="h-6 w-6" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-14 items-center justify-between px-4 bg-background border-b sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative w-full max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t.search}
            className="pl-10 bg-muted border-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch(true)}
        >
          <Search className="h-6 w-6" />
        </Button>
        <LanguageSwitcher />
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" />
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={dbUser?.profileImageUrl} />
                        <AvatarFallback>{dbUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t.myAccount}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/my-account" className="flex items-center">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>{t.myAccount}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t.logOut}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
