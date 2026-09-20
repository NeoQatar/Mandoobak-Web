'use client';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const { direction } = useLanguage();
  
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  
  if (!currentUser && !isAuthPage) {
    router.replace('/login');
    return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }

  if (currentUser && isAuthPage) {
    router.replace('/dashboard');
    return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}</>;
  }




  return (
    <SidebarProvider>
        <Sidebar collapsible="icon" side={direction === 'rtl' ? 'right' : 'left'}>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <ScrollArea className="h-[calc(100vh-theme(height.14))]">
            <main>{children}</main>
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Mandöbak</title>
          <meta name="description" content="Mandöbak Dashboard" />
        </head>
        <body>
          <AuthProvider>
            <AppContent>{children}</AppContent>
          </AuthProvider>
          <Toaster />
        </body>
      </html>
    </LanguageProvider>
  );
}
