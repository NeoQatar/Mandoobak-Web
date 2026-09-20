'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  KeyRound,
  UserCog,
  ShoppingCart,
  Wrench,
  Store,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { getActivityLogs, ActivityLog } from '@/lib/activity-logs';

const translations = {
  en: {
    title: 'Activity Logs',
    filter: 'Filter',
    searchPlaceholder: 'Search by name or action...',
    selectCategory: 'All Categories',
    selectRole: 'All Roles',
    reset: 'Reset',
    performedBy: 'Performed By',
    role: 'Role',
    action: 'Action',
    description: 'Description',
    category: 'Category',
    target: 'Target',
    date: 'Date',
    rowsPerPage: 'Rows per page',
    page: 'Page',
    of: 'of',
    noLogs: 'No activity logs found.',
    auth: 'Auth',
    profile: 'Profile',
    order: 'Order',
    service: 'Service',
    vendor: 'Vendor',
    system: 'System',
    admin: 'Admin',
  },
  ar: {
    title: 'سجل النشاطات',
    filter: 'تصفية',
    searchPlaceholder: 'البحث بالاسم أو الإجراء...',
    selectCategory: 'جميع الفئات',
    selectRole: 'جميع الأدوار',
    reset: 'إعادة تعيين',
    performedBy: 'بواسطة',
    role: 'الدور',
    action: 'الإجراء',
    description: 'الوصف',
    category: 'الفئة',
    target: 'الهدف',
    date: 'التاريخ',
    rowsPerPage: 'صفوف لكل صفحة',
    page: 'صفحة',
    of: 'من',
    noLogs: 'لا توجد سجلات نشاط.',
    auth: 'المصادقة',
    profile: 'الملف الشخصي',
    order: 'الطلب',
    service: 'الخدمة',
    vendor: 'البائع',
    system: 'النظام',
    admin: 'المشرف',
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  auth: <KeyRound className="h-4 w-4" />,
  profile: <UserCog className="h-4 w-4" />,
  order: <ShoppingCart className="h-4 w-4" />,
  service: <Wrench className="h-4 w-4" />,
  vendor: <Store className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 border-blue-200',
  profile: 'bg-purple-100 text-purple-800 border-purple-200',
  order: 'bg-orange-100 text-orange-800 border-orange-200',
  service: 'bg-green-100 text-green-800 border-green-200',
  vendor: 'bg-pink-100 text-pink-800 border-pink-200',
  system: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ActivityLogsPage() {
  const { language, direction } = useLanguage();
  const { dbUser, loading: authLoading } = useAuth();
  const t = translations[language];

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs(500);
      setLogs(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading]);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = logs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.performedByName?.toLowerCase().includes(term) ||
          l.action?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term) ||
          l.targetUserName?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) {
      result = result.filter((l) => l.category === categoryFilter);
    }
    if (roleFilter) {
      result = result.filter((l) => l.performedByRole === roleFilter);
    }
    setFilteredLogs(result);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, roleFilter, logs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setRoleFilter('');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className="text-sm font-medium">{t.filter}</span>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-9 w-full md:w-[280px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter || undefined} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auth">{t.auth}</SelectItem>
            <SelectItem value="profile">{t.profile}</SelectItem>
            <SelectItem value="order">{t.order}</SelectItem>
            <SelectItem value="service">{t.service}</SelectItem>
            <SelectItem value="vendor">{t.vendor}</SelectItem>
            <SelectItem value="system">{t.system}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter || undefined} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectRole} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t.admin}</SelectItem>
            <SelectItem value="vendor">{t.vendor}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={handleReset} className="bg-zinc-50">
            {t.reset}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.performedBy}</TableHead>
                <TableHead>{t.role}</TableHead>
                <TableHead>{t.action}</TableHead>
                <TableHead>{t.description}</TableHead>
                <TableHead>{t.category}</TableHead>
                <TableHead>{t.target}</TableHead>
                <TableHead>{t.date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.performedByName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.performedByRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categoryColors[log.category] || ''}>
                        <span className="mr-1">{categoryIcons[log.category]}</span>
                        {t[log.category as keyof typeof t] || log.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.targetUserName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {t.noLogs}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2 text-sm">
          <span>{t.rowsPerPage}</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => setRowsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {t.page} {currentPage} {t.of} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
