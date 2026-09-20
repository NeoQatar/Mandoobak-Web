
'use client';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart,
  ClipboardList,
  FileText,
  Boxes,
  Database,
  List,
  Package,
  Presentation,
  Heart,
  Users,
  Store,
  Building2,
  Newspaper,
  HelpCircle,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    title: 'Mandobak',
    analytics: 'Analytics',
    dashboard: 'Dashboard',
    users: 'Users',
    usersList: 'Users List',
    orders: 'Orders',
    ordersMenu: 'Orders',
    vendors: 'Vendors',
    invoices: 'Invoices',
    services: 'Services',
    departments: 'Departments',
    categories: 'Categories',
    subCategories: 'Sub Categories',
    servicesList: 'Services List',
    settings: 'Settings',
    packages: 'Packages',
    sliders: 'Sliders',
    sponsors: 'Sponsors',
    news: 'News',
    faqs: 'FAQs',
    privacyPolicy: 'Privacy Policy',
    termsAndConditions: 'Terms & Conditions',
  },
  ar: {
    title: 'Mandobak',
    analytics: 'تحليلات',
    dashboard: 'لوحة التحكم',
    users: 'المستخدمين',
    usersList: 'قائمة المستخدمين',
    orders: 'الطلبات',
    ordersMenu: 'الطلبات',
    vendors: 'البائعون',
    invoices: 'الفواتير',
    services: 'خدمات',
    departments: 'الأقسام',
    categories: 'فئات',
    subCategories: 'الفئات الفرعية',
    servicesList: 'قائمة الخدمات',
    settings: 'إعدادات',
    packages: 'الباقات',
    sliders: 'المنزلقات',
    sponsors: 'الرعاة',
    news: 'أخبار',
    faqs: 'الأسئلة الشائعة',
    privacyPolicy: 'سياسة الخصوصية',
    termsAndConditions: 'الشروط والأحكام',
  },
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { language } = useLanguage();
  const t = translations[language];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader className="flex items-center justify-center h-14 border-b">
        <h2
          className={cn(
            'text-2xl font-jiwez text-center',
            state === 'collapsed' && !isMobile && 'hidden'
          )}
        >
          {t.title}
        </h2>
      </SidebarHeader>
      <ScrollArea>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t.analytics}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard' || pathname === '/'}
                  tooltip={t.dashboard}
                >
                  <Link href="/dashboard">
                    <BarChart />
                    <span>{t.dashboard}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.users}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/users-list')}
                  tooltip={t.usersList}
                >
                  <Link href="/users-list">
                    <Users />
                    <span>{t.usersList}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.orders}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/orders')}
                  tooltip={t.ordersMenu}
                >
                  <Link href="/orders">
                    <ClipboardList />
                    <span>{t.ordersMenu}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.vendors}
                  isActive={pathname.startsWith('/vendors')}
                >
                  <Link href="/vendors">
                    <Store />
                    <span>{t.vendors}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.invoices}
                  isActive={pathname.startsWith('/invoices')}
                >
                  <Link href="/invoices">
                    <FileText />
                    <span>{t.invoices}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.services}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.departments}
                  isActive={pathname.startsWith('/departments')}
                >
                  <Link href="/departments">
                    <Building2 />
                    <span>{t.departments}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.categories}
                  isActive={pathname.startsWith('/categories')}
                >
                  <Link href="/categories">
                    <Boxes />
                    <span>{t.categories}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.subCategories}
                  isActive={pathname.startsWith('/sub-categories')}
                >
                  <Link href="/sub-categories">
                    <Database />
                    <span>{t.subCategories}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.servicesList}
                  isActive={pathname.startsWith('/services-list')}
                >
                  <Link href="/services-list">
                    <List />
                    <span>{t.servicesList}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.settings}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.sliders}
                  isActive={pathname.startsWith('/sliders')}
                >
                  <Link href="/sliders">
                    <Presentation />
                    <span>{t.sliders}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.news}
                  isActive={pathname.startsWith('/news')}
                >
                  <Link href="/news">
                    <Newspaper />
                    <span>{t.news}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.faqs}
                  isActive={pathname.startsWith('/faqs')}
                >
                  <Link href="/faqs">
                    <HelpCircle />
                    <span>{t.faqs}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.privacyPolicy}
                  isActive={pathname.startsWith('/privacy-policy')}
                >
                  <Link href="/privacy-policy">
                    <Shield />
                    <span>{t.privacyPolicy}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem onClick={handleLinkClick}>
                <SidebarMenuButton
                  asChild
                  tooltip={t.termsAndConditions}
                  isActive={pathname.startsWith('/terms-and-conditions')}
                >
                  <Link href="/terms-and-conditions">
                    <FileText />
                    <span>{t.termsAndConditions}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </>
  );
}
