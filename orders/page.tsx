
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import { getOrdersWithDetails, updateOrderStatuses, deleteOrder, OrderWithDetails, OrderStatus, DocumentStatus } from '@/lib/orders';
import { getServices, Service } from '@/lib/services';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const translations = {
  en: {
    allOrders: 'All Orders',
    addNewOrder: 'Add New Order',
    filter: 'Filter',
    searchByUsername: 'Search by username',
    searchByPhone: 'Search by phone number',
    selectService: 'Select Service',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    orderId: 'Order ID',
    customer: 'Customer',
    phoneNumber: 'Phone Number',
    service: 'Service',
    orderStatus: 'Order Status',
    documentStatus: 'Document Status',
    date: 'Date',
    action: 'Action',
    viewDetails: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    deleteOrderTitle: 'Delete Order',
    deleteOrderMessage: 'Are you sure you want to delete this order? This action cannot be undone.',
    'Order Created': 'Order Created',
    'Order Inprogress': 'Order Inprogress',
    'Order Completed': 'Order Completed',
    'Cancelled': 'Cancelled',
    'Documents Pending': 'Documents Pending',
    'Documents Uploaded': 'Documents Uploaded',
    'Documents Approved': 'Documents Approved',
    'Additional Documents Required': 'Additional Documents Required',
    'Documents Delivered': 'Documents Delivered',
    assignedVendor: 'Assigned Vendor',
    department: 'Department',
    category: 'Category',
    subCategory: 'Sub Category',
    status: 'Status',
    paymentStatus: 'Payment Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    page: 'Page',
    of: 'of',
  },
  ar: {
    allOrders: 'كل الطلبات',
    addNewOrder: 'إضافة طلب جديد',
    filter: 'تصفية',
    searchByUsername: 'البحث باسم المستخدم',
    searchByPhone: 'البحث برقم الهاتف',
    selectService: 'اختر الخدمة',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    orderId: 'رقم الطلب',
    customer: 'العميل',
    phoneNumber: 'رقم الهاتف',
    service: 'الخدمة',
    orderStatus: 'حالة الطلب',
    documentStatus: 'حالة المستند',
    date: 'التاريخ',
    action: 'إجراء',
    viewDetails: 'عرض التفاصيل',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    deleteOrderTitle: 'حذف الطلب',
    deleteOrderMessage: 'هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.',
    'Order Created': 'تم إنشاء الطلب',
    'Order Inprogress': 'قيد التنفيذ',
    'Order Completed': 'مكتمل',
    'Cancelled': 'ملغى',
    'Documents Pending': 'في انتظار المستندات',
    'Documents Uploaded': 'تم تحميل المستند',
    'Documents Approved': 'تمت الموافقة على المستند',
    'Additional Documents Required': 'مستند إضافي مطلوب',
    'Documents Delivered': 'تم تسليم المستند',
    assignedVendor: 'الشركة المسندة',
    department: 'قسم',
    category: 'الفئة',
    subCategory: 'الفئة الفرعية',
    status: 'الحالة',
    paymentStatus: 'حالة الدفع',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    page: 'صفحة',
    of: 'من',
  },
};

export default function OrdersPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [usernameFilter, setUsernameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const fetchData = async () => {
    const [ordersData, servicesData] = await Promise.all([
        getOrdersWithDetails(),
        getServices()
    ]);
    
    setOrders(ordersData);
    setServices(servicesData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);
  
  const applyFilters = () => {
    let result = orders;
    if (usernameFilter) {
      result = result.filter(o => o.customerName.toLowerCase().includes(usernameFilter.toLowerCase()));
    }
    if (phoneFilter) {
      result = result.filter(o => o.customerPhone.includes(phoneFilter));
    }
    if (serviceFilter) {
      result = result.filter(o => o.serviceName === serviceFilter);
    }
    if (statusFilter) {
      result = result.filter(o => o.orderStatus === statusFilter || o.documentStatus === statusFilter);
    }
    if (paymentStatusFilter) {
        if (paymentStatusFilter === 'Paid') {
            result = result.filter(o => o.orderStatus === 'Order Completed');
        } else if (paymentStatusFilter === 'Unpaid') {
            result = result.filter(o => o.orderStatus !== 'Order Completed');
        }
    }
    setFilteredOrders(result);
  };
  
  useEffect(() => {
    applyFilters();
  }, [usernameFilter, phoneFilter, serviceFilter, statusFilter, paymentStatusFilter, orders]);


  const handleReset = () => {
    setUsernameFilter('');
    setPhoneFilter('');
    setServiceFilter('');
    setStatusFilter('');
    setPaymentStatusFilter('');
  };
  
  const handleDelete = async (id: string) => {
    setDeletingOrderId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingOrderId) {
      try {
        await deleteOrder(deletingOrderId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete order:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingOrderId(null);
      }
    }
  };
  
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const orderStatusOptions: Record<OrderStatus, string> = {
    'Order Created': t['Order Created'],
    'Order Inprogress': t['Order Inprogress'],
    'Order Completed': t['Order Completed'],
    'Cancelled': t.Cancelled,
  };

  const documentStatusOptions: Record<DocumentStatus, string> = {
    'Documents Pending': t['Documents Pending'],
    'Documents Uploaded': t['Documents Uploaded'],
    'Documents Approved': t['Documents Approved'],
    'Additional Documents Required': t['Additional Documents Required'],
    'Documents Delivered': t['Documents Delivered'],
  };
  
  const allStatusOptions = { ...orderStatusOptions, ...documentStatusOptions };

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


  return (
    <div className="p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allOrders}</h1>
         <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewOrder}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Input
          placeholder={t.searchByUsername}
          className="w-full md:w-auto"
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhone}
          className="w-full md:w-auto"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
        />
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectService} />
          </SelectTrigger>
          <SelectContent>
            {services.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectStatus} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(allStatusOptions).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.paymentStatus} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Paid">{t.paid}</SelectItem>
                <SelectItem value="Unpaid">{t.unpaid}</SelectItem>
            </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button onClick={applyFilters}>{t.apply}</Button>
          <Button variant="outline" onClick={handleReset}>{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orderId}</TableHead>
                <TableHead>{t.customer}</TableHead>
                <TableHead>{t.service}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.paymentStatus}</TableHead>
                <TableHead>{t.assignedVendor}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => {
                const isPaid = order.orderStatus === 'Order Completed';
                return (
                <TableRow key={order.id}>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.serviceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.departmentName} &gt; {order.categoryName} &gt; {order.subCategoryName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.createdAt ? format(parseISO(order.createdAt as string), 'dd-MM-yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={cn("text-xs", statusStyles[order.orderStatus])}>
                            {orderStatusOptions[order.orderStatus] || order.orderStatus}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", statusStyles[order.documentStatus])}>
                            {documentStatusOptions[order.documentStatus] || order.documentStatus}
                        </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", isPaid ? statusStyles['Paid'] : statusStyles['Unpaid'])}>
                      {isPaid ? t.paid : t.unpaid}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.vendorName}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>{t.viewDetails}</DropdownMenuItem>
                        <DropdownMenuItem disabled>{t.edit}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(order.id!)}>{t.delete}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
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
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteOrderTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteOrderMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
