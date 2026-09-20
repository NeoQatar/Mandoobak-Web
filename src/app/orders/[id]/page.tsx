
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, ChevronRight, History, ChevronLeft, Search, Loader2, ChevronDown, FileEdit, Printer, MessageSquare, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { getOrderDetailsById, updateOrderStatuses, OrderStatus, DocumentStatus, OrderWithDetails, Order } from '@/lib/orders';
import { createInvoiceFromOrder, getInvoiceById, getOrdersForInvoice, Invoice } from '@/lib/invoices';
import { MandobakLogo } from '@/components/icons/mandobak-logo';
import { getVendorsFromUsers, User } from '@/lib/users';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { logActivity } from '@/lib/activity-logs';
import { useMemo } from 'react';
import { differenceInDays, add, parse, isValid, parseISO, format, startOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import OrderReceipt from '@/components/order-receipt';

const translations = {
  en: {
    ordersDetails: 'Orders Details',
    allOrders: 'All Orders',
    statusHistory: 'Status History',
    assignVendor: 'Assign Vendor',
    assignOtherVendor: 'Assign Other Vendor',
    assignedVendor: 'Assigned Vendor',
    serviceName: 'Service Name',
    department: 'Department',
    category: 'Category',
    subCategory: 'Sub-Category',
    price: 'Price',
    totalPrice: 'Total Price',
    vendorAmount: 'Vendor Amount',
    serviceContactPerson: 'Service Contact Person',
    phone: 'Phone',
    emailId: 'Email ID',
    serviceDeliveryDate: 'Service Delivery Date',
    serviceStartDate: 'Service Start Date',
    serviceEndDate: 'Service End Date',
    remainingDays: 'Remaining Days',
    customerDetails: 'Customer Details',
    customerName: 'Customer Name',
    dateTime: 'Date & Time',
    inProgress: 'In Progress',
    underReview: 'Under Review',
    cancel: 'Cancel',
    qar: 'QAR',
    loading: 'Loading...',
    orderNotFound: 'Order not found.',
    status: 'Status',
    orderStatus: 'Order Status',
    documentStatus: 'Document Status',
    back: 'Back',
    serviceDetails: 'Service Details',
    'Order Created': 'Order Created',
    'Order Inprogress': 'Order Inprogress',
    'Order Completed': 'Order Completed',
    'Cancelled': 'Cancelled',
    'Documents Pending': 'Documents Pending',
    'Documents Uploaded': 'Documents Uploaded',
    'Documents Approved': 'Documents Approved',
    'Additional Documents Required': 'Additional Documents Required',
    'Documents Delivered': 'Documents Delivered',
    vendorId: 'Vendor ID',
    searchForVendor: 'Search for a vendor...',
    selectVendor: 'Select Vendor',
    vendorAssignedSuccess: 'Vendor assigned successfully.',
    vendorAssignedError: 'Failed to assign vendor.',
    vendorCharges: 'Vendor Charges',
    paymentStatus: 'Payment Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    printReceipt: 'Print Receipt',
    mandobakRevenue: 'Mandobak Revenue',
    chatWithSupport: 'Chat with Support',
    chatSupportDesc: 'Open a conversation with the support team about this order.',
    openChat: 'Open Chat',
    viewDocuments: 'Documents',
    noDocuments: 'No documents uploaded for this order.',
  },
  ar: {
    ordersDetails: 'تفاصيل الطلبات',
    allOrders: 'كل الطلبات',
    statusHistory: 'سجل الحالة',
    assignVendor: 'إسناد بائع',
    assignOtherVendor: 'إسناد بائع آخر',
    assignedVendor: 'البائع المكلف',
    serviceName: 'اسم الخدمة',
    department: 'قسم',
    category: 'الفئة',
    subCategory: 'الفئة الفرعية',
    price: 'السعر',
    totalPrice: 'السعر الإجمالي',
    vendorAmount: 'مبلغ البائع',
    serviceContactPerson: 'مسؤول تواصل الخدمة',
    phone: 'الهاتف',
    emailId: 'البريد الإلكتروني',
    serviceDeliveryDate: 'تاريخ تسليم الخدمة',
    serviceStartDate: 'تاريخ بدء الخدمة',
    serviceEndDate: 'تاريخ انتهاء الخدمة',
    remainingDays: 'الأيام المتبقية',
    customerDetails: 'تفاصيل العميل',
    customerName: 'اسم العميل',
    dateTime: 'التاريخ والوقت',
    inProgress: 'قيد التنفيذ',
    underReview: 'قيد المراجعة',
    cancel: 'إلغاء',
    qar: 'ريال قطري',
    loading: 'جار التحميل...',
    orderNotFound: 'الطلب غير موجود.',
    status: 'الحالة',
    orderStatus: 'حالة الطلب',
    documentStatus: 'حالة المستند',
    back: 'رجوع',
    serviceDetails: 'تفاصيل الخدمة',
    'Order Created': 'تم إنشاء الطلب',
    'Order Inprogress': 'قيد التنفيذ',
    'Order Completed': 'مكتمل',
    'Cancelled': 'ملغى',
    'Documents Pending': 'في انتظار المستندات',
    'Documents Uploaded': 'تم تحميل المستند',
    'Documents Approved': 'تمت الموافقة على المستند',
    'Additional Documents Required': 'مستند إضافي مطلوب',
    'Documents Delivered': 'تم تسليم المستند',
    vendorId: 'معرف البائع',
    searchForVendor: 'ابحث عن بائع ...',
    selectVendor: 'اختر بائع',
    vendorAssignedSuccess: 'Vendor assigned successfully.',
    vendorAssignedError: 'Failed to assign vendor.',
    vendorCharges: 'رسوم البائع',
    paymentStatus: 'حالة الدفع',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    printReceipt: 'طباعة الإيصال',
    mandobakRevenue: 'أرباح مندوبك',
    chatWithSupport: 'المحادثة مع الدعم',
    chatSupportDesc: 'فتح محادثة مع فريق الدعم بشأن هذا الطلب.',
    openChat: 'فتح المحادثة',
    viewDocuments: 'المستندات',
    noDocuments: 'لم يتم رفع مستندات لهذا الطلب.',
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


const StatusDropdown = ({ currentStatus, options, onStatusChange }: { currentStatus: string, options: Record<string, string>, onStatusChange: (newStatus: any) => void }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("justify-between w-fit min-w-[12rem] text-xs px-4 py-1 rounded-full h-auto gap-2", statusStyles[currentStatus])}>
                    <span className="whitespace-nowrap">{options[currentStatus] || currentStatus}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {Object.entries(options).map(([key, value]) => (
                    <DropdownMenuItem key={key} onSelect={() => onStatusChange(key)}>
                        {value}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const AssignVendorDialog = ({ t, orderId, onVendorAssigned, isOpen, onOpenChange, currentVendorId }: { t: any, orderId: string, onVendorAssigned: () => void, isOpen: boolean, onOpenChange: (open: boolean) => void, currentVendorId?: string }) => {
    const [vendors, setVendors] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isVendorListLoading, setIsVendorListLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchVendors = async () => {
                setIsVendorListLoading(true);
                const vendorData = await getVendorsFromUsers();
                setVendors(vendorData);
                setIsVendorListLoading(false);
            };
            fetchVendors();
        }
    }, [isOpen]);

    const filteredVendors = vendors.filter(vendor => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return vendor.userid !== currentVendorId &&
        (vendor.name.toLowerCase().includes(lowerCaseSearchTerm) ||
         vendor.email.toLowerCase().includes(lowerCaseSearchTerm) ||
         (vendor.phoneNumber && vendor.phoneNumber.includes(searchTerm)))
    });

    const handleAssignVendor = async (vendorId: string) => {
        setIsAssigning(true);
        try {
            await updateOrderStatuses(orderId, { orderStatus: 'Order Inprogress' }, vendorId);
            toast({ title: t.vendorAssignedSuccess });
            onVendorAssigned();
            onOpenChange(false);
        } catch (error) {
            toast({ title: t.vendorAssignedError, variant: 'destructive' });
            console.error("Failed to assign vendor:", error);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t.selectVendor}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.searchForVendor}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-72 mt-4">
                        {isVendorListLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredVendors.map(vendor => (
                                    <div key={vendor.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={vendor.profileImageUrl} />
                                                <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{vendor.name}</p>
                                                <p className="text-xs text-muted-foreground">{vendor.email}</p>
                                                <p className="text-xs text-muted-foreground">{vendor.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => handleAssignVendor(vendor.userid)} disabled={isAssigning}>
                                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Assign'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function OrderDetailsPage() {
  const { language, direction } = useLanguage();
  const { dbUser } = useAuth();
  const isVendor = dbUser?.type === 'vendor';
  const isAdmin = dbUser?.type === 'admin';
  const t = translations[language];
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const fetchOrderDetails = async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    try {
      const orderData = await getOrderDetailsById(id);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderDetails = async () => {
      if (typeof id !== 'string') return;
      try {
        const orderData = await getOrderDetailsById(id);
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to refresh order details:', error);
      }
  };

  const handlePrintReceipt = () => {
    setShowReceipt(true);
  };

  useEffect(() => {
    if (!showReceipt) return;
    const timer = setTimeout(() => {
      window.print();
    }, 200);
    const handleAfterPrint = () => setShowReceipt(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [showReceipt]);

  const handleStatusChange = async (statusType: 'orderStatus' | 'documentStatus', newStatus: OrderStatus | DocumentStatus) => {
    if (!order) return;

    let updateData: { orderStatus?: OrderStatus; documentStatus?: DocumentStatus } = { [statusType]: newStatus };
    
    // Auto-update logic based on user's requirements
    if (statusType === 'orderStatus') {
        if (newStatus === 'Order Completed') {
            updateData.documentStatus = 'Documents Delivered';
        } else if (newStatus === 'Order Created') {
            if (order.documentStatus !== 'Documents Pending' && order.documentStatus !== 'Documents Uploaded') {
                updateData.documentStatus = 'Documents Pending';
            }
        } else if (newStatus === 'Order Inprogress') {
             const allowedDocStatuses = ['Documents Pending', 'Documents Uploaded', 'Documents Approved', 'Additional Documents Required'];
             if (!allowedDocStatuses.includes(order.documentStatus)) {
                updateData.documentStatus = 'Documents Pending';
            }
        }
    }

    setOrder(prevOrder => {
        if (!prevOrder) return null;
        const newState = { ...prevOrder, ...updateData };
        
        const historyEntries = Object.entries(updateData).map(([type, status]) => ({
            status: status as OrderStatus | DocumentStatus,
            date: new Date().toISOString(),
            type: (type === 'orderStatus' ? 'order' : 'document') as 'order' | 'document'
        }));

        newState.statusHistory = [...(prevOrder.statusHistory || []), ...historyEntries];
        return newState;
    });

    try {
        await updateOrderStatuses(order.id!, updateData);
        const statusDesc = Object.entries(updateData).map(([k, v]) => `${k}: ${v}`).join(', ');
        logActivity({
          action: 'Order Status Updated',
          description: `Order #${order.orderId || order.id} — ${statusDesc}`,
          performedBy: dbUser?.userid || dbUser?.id || '',
          performedByName: dbUser?.name || '',
          performedByRole: dbUser?.type || 'admin',
          targetUserId: order.customerId,
          targetUserName: order.customerName,
          category: 'order',
        });
    } catch (error) {
        console.error("Failed to update status, reverting optimistic update:", error);
        toast({ title: "Update Failed", description: "Could not update status, please try again.", variant: 'destructive'});
        refreshOrderDetails();
    }
  };
  
  const handlePaymentStatusChange = async (newStatus: 'Paid' | 'Unpaid') => {
    if (!order || isUpdatingPayment) return;
    
    // Only allow changing to Paid if order is completed
    if (newStatus === 'Paid' && order.orderStatus !== 'Order Completed') {
        toast({ title: "Action Not Allowed", description: "Payment can only be marked as Paid once the order is Completed.", variant: 'destructive'});
        return;
    }

    setIsUpdatingPayment(true);
    try {
        let invoiceId = order.invoiceId;
        
        // If marking as Paid and no invoice exists, generate one
        if (newStatus === 'Paid' && !invoiceId) {
            invoiceId = await createInvoiceFromOrder(order, 'Paid');
        }

        await updateOrderStatuses(order.id!, { paymentStatus: newStatus });
        logActivity({
          action: 'Payment Status Updated',
          description: `Order #${order.orderId || order.id} marked as ${newStatus}`,
          performedBy: dbUser?.userid || dbUser?.id || '',
          performedByName: dbUser?.name || '',
          performedByRole: dbUser?.type || 'admin',
          category: 'order',
        });

        setOrder(prev => prev ? { ...prev, paymentStatus: newStatus, invoiceId: invoiceId } : null);
        toast({ title: "Payment Updated", description: `Order marked as ${newStatus}.` });
        
        if (newStatus === 'Paid' && invoiceId) {
            await viewInvoice(invoiceId);
        }
    } catch (error) {
        console.error("Failed to update payment status:", error);
        toast({ title: "Update Failed", description: "Could not update payment status.", variant: 'destructive'});
    } finally {
        setIsUpdatingPayment(false);
    }
  };

  const viewInvoice = async (invoiceId: string) => {
    try {
        const invoiceData = await getInvoiceById(invoiceId);
        if (invoiceData) {
            const ordersData = await getOrdersForInvoice(invoiceData.orderId);
            setCurrentInvoice({ ...invoiceData, orders: ordersData });
            setIsInvoiceDialogOpen(true);
        }
    } catch (error) {
        console.error("Failed to fetch invoice:", error);
        toast({ title: "Error", description: "Could not load invoice details.", variant: 'destructive'});
    }
  };


  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const documentStatusOptions = useMemo(() => {
    if (!order) return {};
    const allOptions: Record<DocumentStatus, string> = {
      'Documents Pending': t['Documents Pending'],
      'Documents Uploaded': t['Documents Uploaded'],
      'Documents Approved': t['Documents Approved'],
      'Additional Documents Required': t['Additional Documents Required'],
      'Documents Delivered': t['Documents Delivered'],
    };

    if (order.orderStatus === 'Order Created') {
      return {
        'Documents Pending': allOptions['Documents Pending'],
        'Documents Uploaded': allOptions['Documents Uploaded'],
      };
    }
    if (order.orderStatus === 'Order Inprogress') {
      return {
        'Documents Pending': allOptions['Documents Pending'],
        'Documents Uploaded': allOptions['Documents Uploaded'],
        'Documents Approved': allOptions['Documents Approved'],
        'Additional Documents Required': allOptions['Additional Documents Required'],
      };
    }
    if (order.orderStatus === 'Order Completed') {
      return {
        'Documents Delivered': allOptions['Documents Delivered'],
      };
    }
    return allOptions;
  }, [order?.orderStatus, t]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm font-medium animate-pulse">{t.loading}</span>
        </div>
    );
  }

  if (!order) {
    return <div className="p-8">{t.orderNotFound}</div>;
  }
  
  const orderStatusOptions: Record<OrderStatus, string> = {
    'Order Created': t['Order Created'],
    'Order Inprogress': t['Order Inprogress'],
    'Order Completed': t['Order Completed'],
    'Cancelled': t.cancel,
  };

  const vendorCharges = (order.commissionpercent && order.commissionpercent > 0) 
    ? (order.totalPrice * (100 - order.commissionpercent)) / 100 
    : order.totalPrice;
  const mandobakRevenue = order.totalPrice - vendorCharges;
  const isPaid = order.paymentStatus === 'Paid';

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
                <h1 className="text-2xl font-bold">{t.ordersDetails}</h1>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <button onClick={() => router.push('/orders')} className="hover:underline flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        {t.allOrders}
                    </button>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span>{order.orderId}</span>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                    {direction === 'rtl' ? <ChevronRight className="h-4 w-4 mr-2" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
                    {t.back}
                </Button>
                <Button variant="default" onClick={handlePrintReceipt}>
                    <Printer className="h-4 w-4 mr-2" />
                    {t.printReceipt}
                </Button>
                {!isVendor && (
                  <>
                    {!order.vendorId ? (
                        <Button variant="default" onClick={() => setIsAssignDialogOpen(true)}>{t.assignVendor}</Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setIsAssignDialogOpen(true)}>{t.assignOtherVendor}</Button>
                    )}
                    <AssignVendorDialog t={t} orderId={order.id!} onVendorAssigned={refreshOrderDetails} isOpen={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen} currentVendorId={order.vendorId}/>
                  </>
                )}
            </div>
        </div>
        
      <h2 className="text-xl font-semibold mb-4 md:mb-6">{order.serviceName}</h2>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-6">
           <div className="flex items-center justify-between w-full md:w-auto md:gap-4">
              <label className="text-sm font-medium whitespace-nowrap mr-4">{t.orderStatus}:</label>
              <StatusDropdown 
                currentStatus={order.orderStatus}
                options={orderStatusOptions}
                onStatusChange={(newStatus) => handleStatusChange('orderStatus', newStatus)}
              />
           </div>
           <div className="flex items-center justify-between w-full md:w-auto md:gap-4">
              <label className="text-sm font-medium whitespace-nowrap mr-4">{t.documentStatus}:</label>
               <StatusDropdown 
                currentStatus={order.documentStatus}
                options={documentStatusOptions}
                onStatusChange={(newStatus) => handleStatusChange('documentStatus', newStatus)}
              />
           </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.customerDetails}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={order.customerProfileImageUrl} />
                  <AvatarFallback>{order.customerName?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between"><span>{t.customerName}:</span> <span className="font-medium">{order.customerName}</span></div>
                  <div className="flex justify-between"><span>{t.phone}:</span> <a href={`tel:${order.customerPhone}`} className="font-medium hover:underline">{order.customerPhone}</a></div>
                  <div className="flex justify-between"><span>{t.emailId}:</span> <a href={`mailto:${order.customerEmail}`} className="font-medium hover:underline">{order.customerEmail || 'N/A'}</a></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.assignedVendor}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={order.vendorProfileImageUrl} />
                  <AvatarFallback>{order.vendorName?.charAt(0) || 'V'}</AvatarFallback>
                </Avatar>
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 flex-1">
                  <div className="flex justify-between"><span>{t.serviceContactPerson}:</span> <span className="font-medium">{order.vendorName}</span></div>
                  <div className="flex justify-between"><span>{t.phone}:</span> <a href={`tel:${order.vendorPhone}`} className="font-medium hover:underline">{order.vendorPhone}</a></div>
                  <div className="flex justify-between"><span>{t.emailId}:</span> <a href={`mailto:${order.vendorEmail}`} className="font-medium hover:underline">{order.vendorEmail}</a></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.serviceDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between"><span>{t.serviceName}:</span> <span className="font-medium">{order.serviceName}</span></div>
                <div className="flex justify-between"><span>{t.department}:</span> <span className="font-medium">{order.departmentName}</span></div>
                <div className="flex justify-between"><span>{t.category}:</span> <span className="font-medium">{order.categoryName}</span></div>
                <div className="flex justify-between"><span>{t.subCategory}:</span> <span className="font-medium">{order.subCategoryName}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-bold"><span>{t.totalPrice}:</span> <span>{order.totalPrice} {t.qar}</span></div>
                 {vendorCharges > 0 && (
                  <div className="flex justify-between font-medium"><span>{t.vendorCharges}:</span> <span className="text-muted-foreground">{vendorCharges.toFixed(2)} {t.qar}</span></div>
                )}
                  <div className="flex justify-between items-center">
                    <span>{t.paymentStatus}:</span>
                    {order.orderStatus === 'Order Completed' ? (
                        isPaid ? (
                            <Badge variant="outline" className={cn("text-xs font-semibold h-7 px-3 rounded-full", statusStyles['Paid'])}>
                                {t.paid}
                            </Badge>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className={cn("text-xs font-semibold h-7 px-3 rounded-full", isPaid ? statusStyles['Paid'] : statusStyles['Unpaid'])}
                                        disabled={isUpdatingPayment}
                                    >
                                        {isPaid ? t.paid : t.unpaid}
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handlePaymentStatusChange('Paid')}>{t.paid}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePaymentStatusChange('Unpaid')}>{t.unpaid}</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    ) : (
                        <Badge variant="outline" className={cn("text-xs font-semibold", statusStyles['Unpaid'])}>
                            {t.unpaid}
                        </Badge>
                    )}
                    {isPaid && order.invoiceId && (
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="h-7 text-xs px-2"
                            onClick={() => viewInvoice(order.invoiceId!)}
                        >
                            View Invoice
                        </Button>
                    )}
                </div>
                {vendorCharges > 0 && (
                    <div className="flex justify-between font-bold text-primary pt-1 mt-1 border-t border-dashed">
                        <span>{t.mandobakRevenue}:</span> 
                        <span>{mandobakRevenue.toFixed(2)} {t.qar}</span>
                    </div>
                )}
              </div>
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between"><span>{t.serviceStartDate}:</span> <span className="font-medium">{order.createdAt ? format(new Date(order.createdAt as string), 'dd-MM-yyyy') : 'N/A'}</span></div>
                <div className="flex justify-between"><span>{t.serviceEndDate}:</span> <span className="font-medium">{order.serviceEndDate}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span>{t.remainingDays}:</span> <span className={`font-medium ${order.remainingDays < 0 ? 'text-red-500' : ''}`}>{order.remainingDays}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Documents section */}
        {order.imageUrl && (
          <Card className="mt-6">
            <CardHeader><CardTitle>{t.viewDocuments}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Order Document</span>
                </div>
                <a href={order.imageUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium">
                  <ExternalLink className="h-4 w-4" /> View
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat — visible to both admin and vendor */}
        {(isVendor || isAdmin) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t.chatWithSupport}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t.chatSupportDesc}</p>
              <Button onClick={() => { sessionStorage.setItem('openChatOrderId', order.orderId); sessionStorage.setItem('openChatVendorId', order.vendorId || ''); router.push('/chat'); }} className="ml-4 shrink-0">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t.openChat}
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Invoice Dialog */}
      {isInvoiceDialogOpen && currentInvoice && (
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Invoice #{currentInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm py-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{currentInvoice.companyName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{currentInvoice.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{currentInvoice.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{currentInvoice.amount} {t.qar}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusStyles[currentInvoice.status] || ''}>{currentInvoice.status}</Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Full-screen receipt overlay — covers the page, then window.print() captures it */}
      {showReceipt && (
        <>
          <style>{`
            @media print {
              body { visibility: hidden; }
              #receipt-print-overlay { visibility: visible; }
              #receipt-print-overlay * {
                visibility: visible;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          `}</style>
          <div
            id="receipt-print-overlay"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh', background: 'white', zIndex: 9999, overflow: 'auto' }}
          >
            <OrderReceipt order={order} language={language} />
          </div>
        </>
      )}
    </div>
  );
}

