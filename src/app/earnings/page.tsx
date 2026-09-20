'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { getOrdersWithDetails, OrderWithDetails } from '@/lib/orders';
import { getVendorPayments } from '@/lib/vendor-payments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    earnings: 'Earnings',
    totalEarnings: 'Total Earnings',
    paidEarnings: 'Paid Earnings',
    pendingEarnings: 'Pending Earnings',
    completedOrders: 'Completed Orders',
    transactions: 'Transactions',
    orderId: 'Order ID',
    service: 'Service',
    customer: 'Customer',
    date: 'Date',
    orderTotal: 'Order Total',
    commission: 'Commission',
    yourEarning: 'Your Earning',
    status: 'Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    all: 'All',
    qar: 'QAR',
    fromDate: 'From',
    toDate: 'To',
    filter: 'Filter',
    reset: 'Reset',
    rowsPerPage: 'Rows per page',
    page: 'Page',
    of: 'of',
    noTransactions: 'No transactions found',
    na: 'N/A',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    last3Months: 'Last 3 Months',
    allTime: 'All Time',
  },
  ar: {
    earnings: 'الأرباح',
    totalEarnings: 'إجمالي الأرباح',
    paidEarnings: 'الأرباح المدفوعة',
    pendingEarnings: 'الأرباح المعلقة',
    completedOrders: 'الطلبات المكتملة',
    transactions: 'المعاملات',
    orderId: 'رقم الطلب',
    service: 'الخدمة',
    customer: 'العميل',
    date: 'التاريخ',
    orderTotal: 'إجمالي الطلب',
    commission: 'العمولة',
    yourEarning: 'أرباحك',
    status: 'الحالة',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    all: 'الكل',
    qar: 'ريال قطري',
    fromDate: 'من',
    toDate: 'إلى',
    filter: 'تصفية',
    reset: 'إعادة تعيين',
    rowsPerPage: 'صفوف لكل صفحة',
    page: 'صفحة',
    of: 'من',
    noTransactions: 'لا توجد معاملات',
    na: 'غير متوفر',
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    last3Months: 'آخر 3 أشهر',
    allTime: 'كل الوقت',
  },
};

type Transaction = {
  id: string;
  orderId: string;
  serviceName: string;
  customerName: string;
  date: string;
  orderTotal: number;
  commissionPercent: number;
  commissionAmount: number;
  vendorEarning: number;
  isPaid: boolean;
};

export default function EarningsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    if (authLoading || !dbUser) return;
    fetchData();
  }, [authLoading, dbUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vendorId = dbUser?.userid || dbUser?.id;
      const [orders, payments] = await Promise.all([
        getOrdersWithDetails(),
        vendorId ? getVendorPayments(vendorId).catch(() => []) : Promise.resolve([]),
      ]);

      const paidOrderIds = new Set(
        payments.filter(p => p.status === 'Paid').flatMap(p => p.orderIds)
      );

      const vendorOrders = vendorId
        ? orders.filter(o => o.vendorId === vendorId && o.orderStatus === 'Order Completed')
        : [];

      const txns: Transaction[] = vendorOrders.map((o) => {
        const commissionPercent = o.commissionpercent || 0;
        const orderTotal = o.totalPrice || 0;
        const commissionAmount = (orderTotal * commissionPercent) / 100;
        const vendorEarning = orderTotal - commissionAmount;
        return {
          id: o.id!,
          orderId: o.orderId,
          serviceName: o.serviceName,
          customerName: o.customerName,
          date: o.createdAt as string,
          orderTotal,
          commissionPercent,
          commissionAmount,
          vendorEarning,
          isPaid: paidOrderIds.has(o.id!),
        };
      });

      txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txns);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = transactions;

    if (periodFilter !== 'all') {
      const now = new Date();
      let start: Date;
      if (periodFilter === 'thisMonth') {
        start = startOfMonth(now);
      } else if (periodFilter === 'lastMonth') {
        start = startOfMonth(subMonths(now, 1));
      } else {
        start = startOfMonth(subMonths(now, 3));
      }
      const end = periodFilter === 'lastMonth' ? endOfMonth(subMonths(now, 1)) : now;
      result = result.filter(tx => {
        try {
          const d = parseISO(tx.date);
          return isWithinInterval(d, { start, end });
        } catch {
          return false;
        }
      });
    }

    if (statusFilter === 'paid') {
      result = result.filter(tx => tx.isPaid);
    } else if (statusFilter === 'unpaid') {
      result = result.filter(tx => !tx.isPaid);
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [transactions, periodFilter, statusFilter]);

  const totalEarnings = filtered.reduce((sum, tx) => sum + tx.vendorEarning, 0);
  const paidEarnings = filtered.filter(tx => tx.isPaid).reduce((sum, tx) => sum + tx.vendorEarning, 0);
  const pendingEarnings = filtered.filter(tx => !tx.isPaid).reduce((sum, tx) => sum + tx.vendorEarning, 0);
  const completedCount = filtered.filter(tx => tx.isPaid).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleReset = () => {
    setPeriodFilter('all');
    setStatusFilter('');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <h1 className="text-2xl font-bold mb-6">{t.earnings}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.totalEarnings}</p>
                <p className="text-xl font-bold">{totalEarnings.toFixed(2)} {t.qar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.paidEarnings}</p>
                <p className="text-xl font-bold">{paidEarnings.toFixed(2)} {t.qar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.pendingEarnings}</p>
                <p className="text-xl font-bold">{pendingEarnings.toFixed(2)} {t.qar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.completedOrders}</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className="text-sm font-medium">{t.filter}</span>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allTime}</SelectItem>
            <SelectItem value="thisMonth">{t.thisMonth}</SelectItem>
            <SelectItem value="lastMonth">{t.lastMonth}</SelectItem>
            <SelectItem value="last3Months">{t.last3Months}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">{t.paid}</SelectItem>
            <SelectItem value="unpaid">{t.unpaid}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={handleReset} className="bg-zinc-50">{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orderId}</TableHead>
                <TableHead>{t.service}</TableHead>
                <TableHead>{t.customer}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead className="text-right">{t.orderTotal}</TableHead>
                <TableHead className="text-right">{t.commission}</TableHead>
                <TableHead className="text-right">{t.yourEarning}</TableHead>
                <TableHead>{t.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.orderId}</TableCell>
                    <TableCell>{tx.serviceName}</TableCell>
                    <TableCell>{tx.customerName}</TableCell>
                    <TableCell>
                      {tx.date ? format(parseISO(tx.date), 'dd-MM-yyyy') : t.na}
                    </TableCell>
                    <TableCell className="text-right">{tx.orderTotal.toFixed(2)} {t.qar}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tx.commissionPercent}% ({tx.commissionAmount.toFixed(2)})
                    </TableCell>
                    <TableCell className="text-right font-medium">{tx.vendorEarning.toFixed(2)} {t.qar}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          tx.isPaid
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        )}
                      >
                        {tx.isPaid ? t.paid : t.unpaid}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {t.noTransactions}
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
