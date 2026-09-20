'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Home, ChevronRight, Phone, Mail, MapPin, ClipboardList,
  CheckCircle, Loader2, FileText, ExternalLink, Wallet,
  DollarSign, Receipt, Upload, X, CreditCard, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserById, type User } from '@/lib/users';
import { getOrdersWithDetails, OrderWithDetails } from '@/lib/orders';
import { getServices, Service } from '@/lib/services';
import { getVendorPayments, createVendorPayment, deleteVendorPayment, VendorPayment } from '@/lib/vendor-payments';
import { uploadFileClient } from '@/lib/storage-client';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const translations = {
  en: {
    vendorDetails: 'Vendor Details',
    allVendors: 'All Vendors',
    loading: 'Loading...',
    vendorNotFound: 'Vendor not found.',
    qar: 'QAR',
    contactInfo: 'Contact Information',
    statistics: 'Statistics',
    processingServices: 'Processing Services',
    completedServices: 'Completed Services',
    assignedOrders: 'Assigned Orders',
    orderId: 'Order ID',
    service: 'Service',
    customer: 'Customer',
    price: 'Price',
    vendorAmount: 'Vendor Amount',
    paymentStatus: 'Payment',
    status: 'Status',
    date: 'Date',
    'Order Created': 'Order Created',
    'Order Inprogress': 'Order Inprogress',
    'Order Completed': 'Order Completed',
    'Cancelled': 'Cancelled',
    'Documents Pending': 'Documents Pending',
    'Documents Uploaded': 'Documents Uploaded',
    'Documents Approved': 'Documents Approved',
    'Additional Documents Required': 'Additional Documents Required',
    'Documents Delivered': 'Documents Delivered',
    documents: 'Documents',
    crDoc: 'CR - Commercial Registration',
    cpDoc: 'CP - Commercial Permit/License',
    eidDoc: 'EID - Electronic ID',
    mouDoc: 'MOU / Agreement',
    viewDocument: 'View',
    noDocuments: 'No documents uploaded',
    monthlyCommission: 'Monthly Commission Invoice',
    month: 'Month',
    totalOrders: 'Total Orders',
    totalAmount: 'Total Amount',
    commissionPercent: 'Commission %',
    commissionAmount: 'Commission Amount',
    assignedServices: 'Assigned Services',
    serviceName: 'Service Name',
    basePrice: 'Base Price',
    serviceCommission: 'Commission %',
    noAssignedServices: 'No services assigned to this vendor.',
    paymentDue: 'Payment Due',
    totalDue: 'Total Due to Vendor',
    unpaidOrders: 'Unpaid Completed Orders',
    payVendor: 'Pay Vendor',
    paymentHistory: 'Payment History',
    generatePayment: 'Generate Payment',
    note: 'Note (Optional)',
    notePlaceholder: 'Add a payment note...',
    cancel: 'Cancel',
    confirm: 'Confirm Payment',
    paying: 'Processing...',
    paymentSuccess: 'Payment recorded successfully.',
    paymentError: 'Failed to record payment.',
    paidAt: 'Paid At',
    orders: 'Orders',
    noPaymentHistory: 'No payment history yet.',
    Paid: 'Paid',
    Pending: 'Pending',
    Unpaid: 'Unpaid',
    viewOrder: 'View',
    viewInvoice: 'Invoice',
    paymentAttachment: 'Payment Attachment',
    attachmentHelp: 'Upload bank transfer receipt or proof of payment',
    uploadAttachment: 'Upload Attachment',
    uploading: 'Uploading...',
    removeAttachment: 'Remove',
    attachmentError: 'Failed to upload attachment.',
    selectOrders: 'Select Orders to Pay',
    selectAll: 'Select All',
    customAmount: 'Payment Amount (QAR)',
    customAmountHelp: 'Edit to pay a specific amount instead of the calculated total',
    paymentMethod: 'Payment Method',
    authNumber: 'Authorization Number',
    transactionNumber: 'Transaction Number',
    bankCardNumber: 'Bank Card / Reference Number',
    location: 'Location',
    noOrdersSelected: 'Select at least one order to proceed.',
  },
  ar: {
    vendorDetails: 'تفاصيل البائع',
    allVendors: 'كل البائعين',
    loading: 'جار التحميل...',
    vendorNotFound: 'البائع غير موجود.',
    qar: 'ريال قطري',
    contactInfo: 'معلومات الاتصال',
    statistics: 'الإحصائيات',
    processingServices: 'خدمات قيد المعالجة',
    completedServices: 'خدمات مكتملة',
    assignedOrders: 'الطلبات المسندة',
    orderId: 'رقم الطلب',
    service: 'الخدمة',
    customer: 'العميل',
    price: 'السعر',
    vendorAmount: 'مبلغ البائع',
    paymentStatus: 'الدفع',
    status: 'الحالة',
    date: 'التاريخ',
    'Order Created': 'تم إنشاء الطلب',
    'Order Inprogress': 'قيد التنفيذ',
    'Order Completed': 'مكتمل',
    'Cancelled': 'ملغى',
    'Documents Pending': 'في انتظار المستندات',
    'Documents Uploaded': 'تم تحميل المستند',
    'Documents Approved': 'تمت الموافقة على المستند',
    'Additional Documents Required': 'مستند إضافي مطلوب',
    'Documents Delivered': 'تم تسليم المستند',
    documents: 'المستندات',
    crDoc: 'السجل التجاري',
    cpDoc: 'الرخصة التجارية',
    eidDoc: 'الهوية الإلكترونية',
    mouDoc: 'مذكرة تفاهم / اتفاقية',
    viewDocument: 'عرض',
    noDocuments: 'لم يتم تحميل مستندات',
    monthlyCommission: 'فاتورة العمولة الشهرية',
    month: 'الشهر',
    totalOrders: 'إجمالي الطلبات',
    totalAmount: 'المبلغ الإجمالي',
    commissionPercent: 'نسبة العمولة',
    commissionAmount: 'مبلغ العمولة',
    assignedServices: 'الخدمات المعينة',
    serviceName: 'اسم الخدمة',
    basePrice: 'السعر الأساسي',
    serviceCommission: 'نسبة العمولة',
    noAssignedServices: 'لا توجد خدمات معينة لهذا البائع.',
    paymentDue: 'المستحقات',
    totalDue: 'إجمالي المستحق للبائع',
    unpaidOrders: 'الطلبات المكتملة غير المدفوعة',
    payVendor: 'دفع للبائع',
    paymentHistory: 'سجل المدفوعات',
    generatePayment: 'إنشاء دفعة',
    note: 'ملاحظة (اختياري)',
    notePlaceholder: 'أضف ملاحظة للدفعة...',
    cancel: 'إلغاء',
    confirm: 'تأكيد الدفع',
    paying: 'جارٍ المعالجة...',
    paymentSuccess: 'تم تسجيل الدفعة بنجاح.',
    paymentError: 'فشل تسجيل الدفعة.',
    paidAt: 'تاريخ الدفع',
    orders: 'الطلبات',
    noPaymentHistory: 'لا يوجد سجل مدفوعات بعد.',
    Paid: 'مدفوع',
    Pending: 'معلق',
    Unpaid: 'غير مدفوع',
    viewOrder: 'عرض',
    viewInvoice: 'فاتورة',
    paymentAttachment: 'مرفق الدفع',
    attachmentHelp: 'ارفع إيصال التحويل البنكي أو إثبات الدفع',
    uploadAttachment: 'رفع مرفق',
    uploading: 'جارٍ الرفع...',
    removeAttachment: 'إزالة',
    attachmentError: 'فشل رفع المرفق.',
    selectOrders: 'اختر الطلبات للدفع',
    selectAll: 'تحديد الكل',
    customAmount: 'مبلغ الدفع (ريال)',
    customAmountHelp: 'عدّل لدفع مبلغ محدد بدلاً من الإجمالي المحسوب',
    paymentMethod: 'طريقة الدفع',
    authNumber: 'رقم التفويض',
    transactionNumber: 'رقم المعاملة',
    bankCardNumber: 'رقم البطاقة / المرجع البنكي',
    location: 'الموقع',
    noOrdersSelected: 'اختر طلباً واحداً على الأقل للمتابعة.',
  },
};

const statusStyles: Record<string, string> = {
  'Order Created': 'text-blue-800 bg-blue-100 border-blue-200',
  'Order Inprogress': 'text-orange-800 bg-orange-100 border-orange-200',
  'Order Completed': 'text-green-800 bg-green-100 border-green-200',
  'Cancelled': 'text-red-800 bg-red-100 border-red-200',
  'Documents Pending': 'text-yellow-800 bg-yellow-100 border-yellow-200',
  'Documents Uploaded': 'text-blue-800 bg-blue-100 border-blue-200',
  'Documents Approved': 'text-green-800 bg-green-100 border-green-200',
  'Additional Documents Required': 'text-red-800 bg-red-100 border-red-200',
  'Documents Delivered': 'text-purple-800 bg-purple-100 border-purple-200',
  'Paid': 'text-green-800 bg-green-100 border-green-200',
  'Unpaid': 'text-red-800 bg-red-100 border-red-200',
};

export default function VendorDetailsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;

  const [vendor, setVendor] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [authNumber, setAuthNumber] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [bankCardNumber, setBankCardNumber] = useState('');
  const [location, setLocation] = useState('Doha, Qatar');
  const attachmentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    if (typeof id !== 'string') return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vendorData, allOrders, allServices] = await Promise.all([
          getUserById(id as string),
          getOrdersWithDetails(),
          getServices(),
        ]);
        setVendor(vendorData);
        if (vendorData) {
          const vid = vendorData.userid || vendorData.id || '';
          const vendorOrders = allOrders
            .filter(order => order.vendorId === vid)
            .sort((a, b) => (parseInt(b.orderId) || 0) - (parseInt(a.orderId) || 0));
          setOrders(vendorOrders);
          setAssignedServices(allServices.filter(s => s.vendorId === vid));
        }
      } catch (error) {
        console.error('Failed to fetch vendor details:', error);
      } finally {
        setLoading(false);
      }
      // Load payments separately — requires a Firestore index; failure must not block the main page
      try {
        const paymentHistory = await getVendorPayments(id as string);
        setPayments(paymentHistory);
      } catch {
        // Index may not exist yet; payments section will just be empty
      }
    };
    fetchData();
  }, [id]);

  const unpaidCompletedOrders = orders.filter(
    o => o.orderStatus === 'Order Completed' && o.paymentStatus !== 'Paid'
  );
  const totalCompletedAmount = orders
    .filter(o => o.orderStatus === 'Order Completed')
    .reduce((sum, o) => sum + (o.vendorAmount || 0), 0);
  const totalPaidAmount = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDue = Math.max(0, totalCompletedAmount - totalPaidAmount);

  const openPayDialog = () => {
    const ids = unpaidCompletedOrders.map(o => o.id!).filter(Boolean);
    setSelectedOrderIds(ids);
    const total = unpaidCompletedOrders.reduce((sum, o) => sum + (o.vendorAmount || 0), 0);
    setCustomAmount(total.toFixed(2));
    setPayDialogOpen(true);
  };

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const next = prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId];
      const selected = unpaidCompletedOrders.filter(o => next.includes(o.id!));
      setCustomAmount(selected.reduce((sum, o) => sum + (o.vendorAmount || 0), 0).toFixed(2));
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedOrderIds.length === unpaidCompletedOrders.length) {
      setSelectedOrderIds([]);
      setCustomAmount('0.00');
    } else {
      const ids = unpaidCompletedOrders.map(o => o.id!).filter(Boolean);
      setSelectedOrderIds(ids);
      setCustomAmount(unpaidCompletedOrders.reduce((sum, o) => sum + (o.vendorAmount || 0), 0).toFixed(2));
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileClient(file, 'vendor-payments', `${vendor?.userid || id}-${Date.now()}`);
      setAttachmentUrl(url);
    } catch {
      toast({ title: t.attachmentError, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (attachmentRef.current) attachmentRef.current.value = '';
    }
  };

  const handlePay = async () => {
    if (!vendor) return;
    if (selectedOrderIds.length === 0) {
      toast({ title: t.noOrdersSelected, variant: 'destructive' });
      return;
    }
    setPaying(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const vid = vendor.userid || vendor.id || '';
      const amount = parseFloat(customAmount) || 0;
      const paymentId = await createVendorPayment({
        vendorId: vid,
        vendorName: vendor.name,
        amount,
        orderIds: selectedOrderIds,
        orderCount: selectedOrderIds.length,
        month: currentMonth,
        note,
        attachmentUrl,
        paymentMethod,
        authNumber,
        transactionNumber,
        bankCardNumber,
        location,
        status: 'Paid',
        paidAt: new Date().toISOString(),
      });
      setPayDialogOpen(false);
      setNote('');
      setAttachmentUrl('');
      setAuthNumber('');
      setTransactionNumber('');
      setBankCardNumber('');
      router.push(`/vendors/${id}/invoice/${paymentId}`);
    } catch {
      toast({ title: t.paymentError, variant: 'destructive' });
      setPaying(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!paymentId) return;
    const confirmed = window.confirm('Delete this payment? The amount will be added back to the vendor due.');
    if (!confirmed) return;
    try {
      await deleteVendorPayment(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast({ title: 'Payment deleted' });
    } catch {
      toast({ title: 'Failed to delete payment', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm font-medium animate-pulse">{t.loading}</span>
      </div>
    );
  }

  if (!vendor) return <div className="p-8 text-center">{t.vendorNotFound}</div>;

  const orderStatusOptions: Record<string, string> = {
    'Order Created': t['Order Created'],
    'Order Inprogress': t['Order Inprogress'],
    'Order Completed': t['Order Completed'],
    'Cancelled': t.Cancelled,
  };

  const documentStatusOptions: Record<string, string> = {
    'Documents Pending': t['Documents Pending'],
    'Documents Uploaded': t['Documents Uploaded'],
    'Documents Approved': t['Documents Approved'],
    'Additional Documents Required': t['Additional Documents Required'],
    'Documents Delivered': t['Documents Delivered'],
  };

  const processingCount = orders.filter(o => o.orderStatus === 'Order Inprogress').length;
  const completedCount = orders.filter(o => o.orderStatus === 'Order Completed').length;

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.vendorDetails}</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <button onClick={() => router.push('/dashboard')} className="hover:underline flex items-center">
              <Home className="h-4 w-4 mr-1" />Dashboard
            </button>
            <ChevronRight className="h-4 w-4 mx-1" />
            <button onClick={() => router.push('/vendors')} className="hover:underline">{t.allVendors}</button>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>{vendor.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={vendor.profileImageUrl} />
                  <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{vendor.name}</h2>
                <p className="text-sm text-muted-foreground">{vendor.email}</p>
                <Badge className={`mt-2 ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {vendor.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.contactInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center"><Phone className="h-4 w-4 mr-3 text-muted-foreground" /><span>{vendor.phoneNumber}</span></div>
              <div className="flex items-center"><Mail className="h-4 w-4 mr-3 text-muted-foreground" /><span>{vendor.email}</span></div>
              <div className="flex items-center"><MapPin className="h-4 w-4 mr-3 text-muted-foreground" /><span>{vendor.city}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.statistics}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 mr-3 text-orange-500" />
                  <span className="text-sm font-medium">{t.processingServices}</span>
                </div>
                <span className="text-lg font-bold">{processingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-sm font-medium">{t.completedServices}</span>
                </div>
                <span className="text-lg font-bold">{completedCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={totalDue > 0 ? 'border-orange-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-orange-500" />
                {t.paymentDue}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.unpaidOrders}</span>
                <span className="font-semibold">{unpaidCompletedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">{t.totalDue}</span>
                <span className={`text-xl font-bold ${totalDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {totalDue.toFixed(2)} {t.qar}
                </span>
              </div>
              {totalDue > 0 && (
                <Button className="w-full" onClick={openPayDialog}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t.payVendor}
                </Button>
              )}
              {totalDue === 0 && unpaidCompletedOrders.length === 0 && (
                <p className="text-sm text-center text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" /> All payments cleared
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.documents}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const docs = [
                  { label: t.crDoc, url: vendor.crDocUrl },
                  { label: t.cpDoc, url: vendor.cpDocUrl },
                  { label: t.eidDoc, url: vendor.eidDocUrl },
                  { label: t.mouDoc, url: vendor.mouDocUrl },
                ];
                const hasDocs = docs.some(d => d.url);
                if (!hasDocs) return <p className="text-sm text-muted-foreground">{t.noDocuments}</p>;
                return docs.map((d, i) => d.url ? (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{d.label}</span>
                    </div>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" />{t.viewDocument}
                    </a>
                  </div>
                ) : null);
              })()}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t.assignedOrders}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="relative w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.orderId}</TableHead>
                        <TableHead>{t.service}</TableHead>
                        <TableHead>{t.customer}</TableHead>
                        <TableHead className="text-right">{t.vendorAmount}</TableHead>
                        <TableHead>{t.paymentStatus}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead>{t.date}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                            No orders assigned.
                          </TableCell>
                        </TableRow>
                      ) : orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{order.serviceName}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(order.vendorAmount || 0).toFixed(2)} {t.qar}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusStyles[order.paymentStatus || ''] || ''}>
                              {t[(order.paymentStatus || '') as keyof typeof t] || order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className={statusStyles[order.orderStatus]}>
                                {orderStatusOptions[order.orderStatus] || order.orderStatus}
                              </Badge>
                              <Badge variant="outline" className={statusStyles[order.documentStatus]}>
                                {documentStatusOptions[order.documentStatus] || order.documentStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {order.createdAt ? format(parseISO(order.createdAt as string), 'dd-MM-yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}`)}
                            >
                              {t.viewOrder}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.assignedServices}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="relative w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.serviceName}</TableHead>
                        <TableHead className="text-center">{t.basePrice}</TableHead>
                        <TableHead className="text-center">{t.serviceCommission}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedServices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">{t.noAssignedServices}</TableCell>
                        </TableRow>
                      ) : assignedServices.map(service => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell className="text-center">{service.basePrice || 0} {t.qar}</TableCell>
                          <TableCell className="text-center">{service.commissionPercent || 0}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.monthlyCommission}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="relative w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.month}</TableHead>
                        <TableHead className="text-center">{t.totalOrders}</TableHead>
                        <TableHead className="text-center">{t.totalAmount}</TableHead>
                        <TableHead className="text-center">{t.commissionPercent}</TableHead>
                        <TableHead className="text-center">{t.commissionAmount}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const completedOrders = orders.filter(o => o.orderStatus === 'Order Completed');
                        const grouped: Record<string, { orders: number; amount: number }> = {};
                        completedOrders.forEach(o => {
                          const monthKey = o.createdAt ? format(parseISO(o.createdAt as string), 'yyyy-MM') : 'Unknown';
                          if (!grouped[monthKey]) grouped[monthKey] = { orders: 0, amount: 0 };
                          grouped[monthKey].orders++;
                          grouped[monthKey].amount += o.totalPrice || 0;
                        });
                        const commissionPct = vendor.percentage || 0;
                        const sortedMonths = Object.keys(grouped).sort().reverse();
                        if (sortedMonths.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No completed orders.</TableCell>
                            </TableRow>
                          );
                        }
                        return sortedMonths.map(month => {
                          const data = grouped[month];
                          const commission = (data.amount * commissionPct) / 100;
                          return (
                            <TableRow key={month}>
                              <TableCell className="font-medium">{month}</TableCell>
                              <TableCell className="text-center">{data.orders}</TableCell>
                              <TableCell className="text-center">{data.amount.toFixed(2)} {t.qar}</TableCell>
                              <TableCell className="text-center">{commissionPct}%</TableCell>
                              <TableCell className="text-center font-semibold">{commission.toFixed(2)} {t.qar}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t.paymentHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="relative w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.month}</TableHead>
                        <TableHead className="text-center">{t.orders}</TableHead>
                        <TableHead className="text-right">{t.totalAmount}</TableHead>
                        <TableHead>{t.paidAt}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                            {t.noPaymentHistory}
                          </TableCell>
                        </TableRow>
                      ) : payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.month}</TableCell>
                          <TableCell className="text-center">{p.orderCount}</TableCell>
                          <TableCell className="text-right font-semibold">{p.amount.toFixed(2)} {t.qar}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {p.paidAt ? format(parseISO(p.paidAt), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusStyles[p.status] || ''}>
                              {t[p.status as keyof typeof t] || p.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/vendors/${id}/invoice/${p.id}`)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {t.viewInvoice}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeletePayment(p.id!)}
                                title="Delete payment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t.payVendor} — {vendor.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Order Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t.selectOrders}</Label>
                <button onClick={toggleAll} className="text-xs text-primary underline">
                  {selectedOrderIds.length === unpaidCompletedOrders.length ? 'Deselect All' : t.selectAll}
                </button>
              </div>
              <ScrollArea className="h-44 rounded-lg border p-2">
                <div className="space-y-2">
                  {unpaidCompletedOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`order-${order.id}`}
                        checked={selectedOrderIds.includes(order.id!)}
                        onCheckedChange={() => toggleOrder(order.id!)}
                      />
                      <label htmlFor={`order-${order.id}`} className="flex-1 cursor-pointer text-sm">
                        <span className="font-medium">#{order.orderId}</span>
                        <span className="text-muted-foreground ml-2">{order.serviceName}</span>
                      </label>
                      <span className="text-sm font-semibold shrink-0">
                        {(order.vendorAmount || 0).toFixed(2)} {t.qar}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Custom Amount */}
            <div className="space-y-1">
              <Label htmlFor="custom-amount">{t.customAmount}</Label>
              <p className="text-xs text-muted-foreground">{t.customAmountHelp}</p>
              <Input
                id="custom-amount"
                type="number"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pay-method">{t.paymentMethod}</Label>
                <select
                  id="pay-method"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="pay-location">{t.location}</Label>
                <Input
                  id="pay-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="auth-number">{t.authNumber}</Label>
                <Input
                  id="auth-number"
                  value={authNumber}
                  onChange={e => setAuthNumber(e.target.value)}
                  placeholder="e.g. AUTH123456"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="txn-number">{t.transactionNumber}</Label>
                <Input
                  id="txn-number"
                  value={transactionNumber}
                  onChange={e => setTransactionNumber(e.target.value)}
                  placeholder="e.g. TXN789012"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bank-card">{t.bankCardNumber}</Label>
              <Input
                id="bank-card"
                value={bankCardNumber}
                onChange={e => setBankCardNumber(e.target.value)}
                placeholder="e.g. **** **** **** 1234"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label>{t.paymentAttachment}</Label>
              <p className="text-xs text-muted-foreground">{t.attachmentHelp}</p>
              {attachmentUrl ? (
                <div className="flex items-center gap-2 rounded-lg border p-2 bg-green-50">
                  <FileText className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 flex-1 truncate">Attachment uploaded</span>
                  <button onClick={() => setAttachmentUrl('')} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                  <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    View
                  </a>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => attachmentRef.current?.click()} disabled={isUploading}>
                  {isUploading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.uploading}</>
                    : <><Upload className="h-4 w-4 mr-2" />{t.uploadAttachment}</>}
                </Button>
              )}
              <input ref={attachmentRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAttachmentChange} />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">{t.note}</Label>
              <Textarea id="note" placeholder={t.notePlaceholder} value={note} onChange={e => setNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayDialogOpen(false); setAttachmentUrl(''); setNote(''); }} disabled={paying || isUploading}>
              {t.cancel}
            </Button>
            <Button onClick={handlePay} disabled={paying || isUploading || selectedOrderIds.length === 0}>
              {paying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.paying}</> : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
