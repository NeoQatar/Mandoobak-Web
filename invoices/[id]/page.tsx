
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Home, ChevronRight, Printer, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getInvoiceById, getOrdersForInvoice, Invoice, updateInvoiceStatus } from '@/lib/invoices';
import { Order } from '@/lib/orders';
import { useLanguage } from '@/context/language-context';
import { MandobakLogo } from '@/components/icons/mandobak-logo';

const translations = {
  en: {
    invoiceDetails: 'Invoice Details',
    invoices: 'Invoices',
    print: 'Print',
    paid: 'Paid',
    unpaid: 'Unpaid',
    mandobakInvoice: 'Invoice',
    invoiceId: 'Invoice ID:',
    dateTime: 'Date:',
    paidDate: 'Paid Date:',
    billTo: 'Bill To:',
    phone: 'Phone:',
    orderDetails: 'Order Details',
    orderId: 'Order ID',
    service: 'Service',
    category: 'Category',
    subCategory: 'Sub-Category',
    amount: 'Amount',
    qar: 'QAR',
    loading: 'Loading...',
    invoiceNotFound: 'Invoice not found.',
    total: 'Total',
    thankYou: 'Thank you for your business!',
  },
  ar: {
    invoiceDetails: 'تفاصيل الفاتورة',
    invoices: 'الفواتير',
    print: 'طباعة',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    mandobakInvoice: 'فاتورة',
    invoiceId: 'رقم الفاتورة:',
    dateTime: 'التاريخ:',
    paidDate: 'تاريخ الدفع:',
    billTo: 'فاتورة إلى:',
    phone: 'الهاتف:',
    orderDetails: 'تفاصيل الطلب',
    orderId: 'رقم الطلب',
    service: 'الخدمة',
    category: 'الفئة',
    subCategory: 'الفئة الفرعية',
    amount: 'المبلغ',
    qar: 'ريال قطري',
    loading: 'جار التحميل...',
    invoiceNotFound: 'الفاتورة غير موجودة.',
    total: 'المجموع',
    thankYou: 'شكرا لتعاملكم معنا!',
  },
};

type InvoiceDetails = Invoice & {
  orders: Order[];
  paidDate: string;
};

export default function InvoiceDetailsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = params;

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const fetchInvoiceDetails = async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    try {
      const invoiceData = await getInvoiceById(id);
      if (invoiceData) {
        const ordersData = await getOrdersForInvoice(invoiceData.orderId);
        
        const paidDate = new Date();
        paidDate.setDate(paidDate.getDate() - 7);


        setInvoice({
          ...invoiceData,
          orders: ordersData,
          paidDate: paidDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);
  
  useEffect(() => {
      if (searchParams.get('print') === 'true' && !loading) {
          handlePrint();
      }
  }, [searchParams, loading]);
  
  const handlePrint = () => {
    window.print();
  }

  const handleStatusToggle = async () => {
    if (!invoice) return;
    const newStatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid';
    try {
        await updateInvoiceStatus(invoice.id!, newStatus);
        fetchInvoiceDetails(); // Re-fetch to update UI
    } catch (error) {
        console.error("Failed to update status:", error);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">{t.loading}</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center">{t.invoiceNotFound}</div>;
  }

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="print-hide mb-6">
        <h1 className="text-2xl font-bold mb-2">{t.invoiceDetails}</h1>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
                <button onClick={() => router.push('/dashboard')} className="hover:underline flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Dashboard
                </button>
                <ChevronRight className="h-4 w-4 mx-1" />
                <button onClick={() => router.push('/invoices')} className="hover:underline">{t.invoices}</button>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span>{invoice.invoiceNumber}</span>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="default" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t.print}
                </Button>
                <Button 
                    variant={invoice.status === 'Paid' ? 'destructive' : 'default'}
                    onClick={handleStatusToggle}
                    className={invoice.status === 'Paid' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                >
                    <FileEdit className="mr-2 h-4 w-4" />
                    {invoice.status === 'Paid' ? t.unpaid : t.paid}
                </Button>
            </div>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none printable-area w-full max-w-4xl mx-auto">
        <CardHeader className="p-0">
          <div className="flex justify-between items-start p-6">
            <div>
              <MandobakLogo className="h-12 w-auto" />
              <p className="text-muted-foreground text-sm mt-2">Doha, Qatar</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold uppercase text-primary">{t.mandobakInvoice}</h1>
              <p className="text-sm"><span>{t.invoiceId}</span> <span>{invoice.invoiceNumber}</span></p>
              <p className="text-sm"><span>{t.dateTime}</span> <span>{invoice.date}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <h2 className="font-semibold mb-2">{t.billTo}</h2>
              <p>{invoice.companyName}</p>
              <p className="text-muted-foreground">{invoice.phone}</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">{t.orderDetails}</h3>
          <div className="rounded-lg border">
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderId}</TableHead>
                    <TableHead>{t.service}</TableHead>
                    <TableHead>{t.category}</TableHead>
                    <TableHead className="text-right">{t.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderId}</TableCell>
                      <TableCell>{order.serviceDetails?.name}</TableCell>
                      <TableCell>{order.serviceDetails?.categoryName}</TableCell>
                      <TableCell className="text-right">{order.serviceDetails?.basePrice} {t.qar}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-muted/50">
          <div className="w-full flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{t.thankYou}</p>
            <div className="text-right">
              <p className="text-sm font-semibold">{t.total}</p>
              <p className="text-2xl font-bold">{invoice.amount} {t.qar}</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
