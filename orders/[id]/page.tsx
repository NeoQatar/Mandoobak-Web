
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, ChevronRight, History, ChevronLeft, Search, Loader2, ChevronDown, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

import { getOrderDetailsById, updateOrderStatuses, OrderStatus, DocumentStatus, OrderWithDetails } from '@/lib/orders';
import { getVendorsFromUsers, User } from '@/lib/users';
import { useLanguage } from '@/context/language-context';
import { differenceInDays, add, parse, isValid, parseISO, format, startOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
                <Button variant="outline" className={cn("justify-between w-48 text-xs px-4 py-1 rounded-full", statusStyles[currentStatus])}>
                    <span>{options[currentStatus] || currentStatus}</span>
                    <ChevronDown className="h-4 w-4" />
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
  const t = translations[language];
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

  const handleStatusChange = async (statusType: 'orderStatus' | 'documentStatus', newStatus: OrderStatus | DocumentStatus) => {
    if (!order) return;

    setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
            ...prevOrder,
            [statusType]: newStatus,
            statusHistory: [
                ...(prevOrder.statusHistory || []),
                { status: newStatus, date: new Date().toISOString(), type: statusType === 'orderStatus' ? 'order' : 'document' }
            ]
        };
    });

    try {
        await updateOrderStatuses(order.id!, { [statusType]: newStatus });
    } catch (error) {
        console.error("Failed to update status, reverting optimistic update:", error);
        toast({ title: "Update Failed", description: "Could not update status, please try again.", variant: 'destructive'});
        // Revert UI change on failure
        refreshOrderDetails();
    }
  };


  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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

  const documentStatusOptions: Record<DocumentStatus, string> = {
    'Documents Pending': t['Documents Pending'],
    'Documents Uploaded': t['Documents Uploaded'],
    'Documents Approved': t['Documents Approved'],
    'Additional Documents Required': t['Additional Documents Required'],
    'Documents Delivered': t['Documents Delivered'],
  };

  const vendorCharges = (order.commissionpercent && order.commissionpercent > 0) 
    ? (order.totalPrice * order.commissionpercent) / 100 
    : 0;
  const isPaid = order.orderStatus === 'Order Completed';

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
                {!order.vendorId ? (
                    <Button variant="default" onClick={() => setIsAssignDialogOpen(true)}>{t.assignVendor}</Button>
                ) : (
                    <Button variant="secondary" onClick={() => setIsAssignDialogOpen(true)}>{t.assignOtherVendor}</Button>
                )}
                <AssignVendorDialog t={t} orderId={order.id!} onVendorAssigned={refreshOrderDetails} isOpen={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen} currentVendorId={order.vendorId}/>
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
                  <div className="flex justify-between"><span>{t.vendorCharges}:</span> <span className="font-medium">{vendorCharges.toFixed(2)} {t.qar}</span></div>
                )}
                 <div className="flex justify-between items-center">
                    <span>{t.paymentStatus}:</span>
                    <Badge variant="outline" className={cn("text-xs font-semibold", isPaid ? statusStyles['Paid'] : statusStyles['Unpaid'])}>
                        {isPaid ? t.paid : t.unpaid}
                    </Badge>
                </div>
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
    </div>
  );
}
