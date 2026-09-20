
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
  Printer,
  FileEdit,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import {
  getInvoices,
  updateInvoiceStatus,
  InvoiceWithOrderDetails,
} from '@/lib/invoices';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { parseISO, isWithinInterval, format } from 'date-fns';

const translations = {
  
  
  en: {
    invoices: 'Invoices',
    filter: 'Filter',
    searchByCompany: 'Search by customer name',
    searchByPhone: 'Search by phone number',
    apply: 'Apply',
    reset: 'Reset',
    invoiceId: 'Invoice ID',
    customerName: 'Customer Name',
    serviceName: 'Service Name',
    amount: 'Amount',
    status: 'Status',
    date: 'Date',
    action: 'Action',
    rowsPerPage: 'Rows per page',
    qar: 'QAR',
    paid: 'Paid',
    unpaid: 'Unpaid',
    print: 'Print',
    page: 'Page',
    of: 'of',
  },
  ar: {
    invoices: 'الفواتير',
    filter: 'تصفية',
    searchByCompany: 'البحث باسم العميل',
    searchByPhone: 'البحث برقم الهاتف',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    invoiceId: 'رقم الفاتورة',
    customerName: 'اسم العميل',
    serviceName: 'اسم الخدمة',
    amount: 'المبلغ',
    status: 'الحالة',
    date: 'التاريخ',
    action: 'إجراء',
    rowsPerPage: 'صفوف لكل صفحة',
    qar: 'ريال قطري',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    print: 'طباعة',
    page: 'صفحة',
    of: 'من',
  },
};

export default function InvoicesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [invoices, setInvoices] = useState<InvoiceWithOrderDetails[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<
    InvoiceWithOrderDetails[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const [customerFilter, setCustomerFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchInvoices = async () => {
    setLoading(true);
    const invoicesData = await getInvoices();
    setInvoices(invoicesData);
    setFilteredInvoices(invoicesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const applyFilters = () => {
    let result = invoices;
    if (customerFilter) {
      result = result.filter((invoice) =>
        invoice.companyName.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }
    if (phoneFilter) {
      result = result.filter((invoice) => invoice.phone.includes(phoneFilter));
    }
    if (dateRange?.from) {
      const toDate = dateRange.to || dateRange.from;
      const interval = { start: dateRange.from, end: toDate };
      result = result.filter((invoice) => {
        if (!invoice.date) return false;
        const invoiceDate = parseISO(invoice.date as string);
        return isWithinInterval(invoiceDate, interval);
      });
    }
    setFilteredInvoices(result);
  };

  useEffect(() => {
    applyFilters();
  }, [customerFilter, phoneFilter, dateRange, invoices]);

  const handleReset = () => {
    setCustomerFilter('');
    setPhoneFilter('');
    setDateRange(undefined);
  };

  const handleStatusToggle = async (invoiceId: string, currentStatus: 'Paid' | 'Unpaid') => {
      const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
      try {
          await updateInvoiceStatus(invoiceId, newStatus);
          fetchInvoices();
      } catch (error) {
          console.error("Failed to update invoice status:", error);
      }
  };

  const handlePrint = (invoiceId: string) => {
      router.push(`/invoices/${invoiceId}?print=true`);
  }

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t.invoices}</h1>
        <DateRangePicker onDateChange={setDateRange} />
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className="text-sm font-medium">{t.filter}</span>
        <Input
          placeholder={t.searchByCompany}
          className="w-full sm:w-auto"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhone}
          className="w-full sm:w-auto"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
        />
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button onClick={applyFilters} className="w-full sm:w-auto">{t.apply}</Button>
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            {t.reset}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.invoiceId}</TableHead>
                <TableHead>{t.customerName}</TableHead>
                <TableHead>{t.serviceName}</TableHead>
                <TableHead>{t.amount}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead className="text-right">{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} onClick={() => router.push(`/invoices/${invoice.id}`)} className="cursor-pointer">
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.companyName}</TableCell>
                    <TableCell>{invoice.serviceName}</TableCell>
                    <TableCell>
                      {invoice.amount} {t.qar}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.date), 'dd-MM-yyyy')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.status === 'Paid' ? t.paid : t.unpaid}
                      </span>
                    </TableCell>
                     <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handlePrint(invoice.id!)}>
                                <Printer className="mr-2 h-4 w-4" />
                                {t.print}
                            </Button>
                            <Button 
                                variant={invoice.status === 'Paid' ? 'destructive' : 'default'} 
                                size="sm"
                                onClick={() => handleStatusToggle(invoice.id!, invoice.status)}
                            >
                                <FileEdit className="mr-2 h-4 w-4" />
                                {invoice.status === 'Paid' ? t.unpaid : t.paid}
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
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
