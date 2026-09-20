
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, ChevronRight, User, Phone, Mail, MapPin, ClipboardList, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { getUserById, User } from '@/lib/users';
import { getOrdersWithDetails, OrderWithDetails } from '@/lib/orders';
import { useLanguage } from '@/context/language-context';
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
  },
};

export default function VendorDetailsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [vendor, setVendor] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    if (typeof id !== 'string') return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vendorData, allOrders] = await Promise.all([
          getUserById(id as string),
          getOrdersWithDetails()
        ]);
        
        setVendor(vendorData);
        if(vendorData) {
            const vendorOrders = allOrders.filter(order => order.vendorId === vendorData.userid);
            setOrders(vendorOrders);
        }
      } catch (error) {
        console.error('Failed to fetch vendor details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin mr-2" /> {t.loading}</div>;
  }

  if (!vendor) {
    return <div className="p-8 text-center">{t.vendorNotFound}</div>;
  }

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
  };

  const processingServicesCount = orders.filter(o => o.orderStatus === 'Order Inprogress').length;
  const completedServicesCount = orders.filter(o => o.orderStatus === 'Order Completed').length;

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.vendorDetails}</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <button onClick={() => router.push('/dashboard')} className="hover:underline flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
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
                <Badge className={`mt-2 ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{vendor.status}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t.contactInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center"><Phone className="h-4 w-4 mr-3 text-muted-foreground" /> <span>{vendor.phoneNumber}</span></div>
              <div className="flex items-center"><Mail className="h-4 w-4 mr-3 text-muted-foreground" /> <span>{vendor.email}</span></div>
              <div className="flex items-center"><MapPin className="h-4 w-4 mr-3 text-muted-foreground" /> <span>{vendor.city}</span></div>
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
                <span className="text-lg font-bold">{processingServicesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-sm font-medium">{t.completedServices}</span>
                </div>
                <span className="text-lg font-bold">{completedServicesCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.assignedOrders}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <div className="relative w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t.orderId}</TableHead>
                                <TableHead>{t.service}</TableHead>
                                <TableHead>{t.customer}</TableHead>
                                <TableHead>{t.price}</TableHead>
                                <TableHead>{t.status}</TableHead>
                                <TableHead>{t.date}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.orderId}</TableCell>
                                <TableCell>{order.serviceName}</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell>{order.totalPrice} {t.qar}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className={statusStyles[order.orderStatus]}>
                                            {orderStatusOptions[order.orderStatus] || order.orderStatus}
                                        </Badge>
                                        <Badge variant="outline" className={statusStyles[order.documentStatus]}>
                                            {documentStatusOptions[order.documentStatus] || order.documentStatus}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>{order.createdAt ? format(parseISO(order.createdAt as string), 'dd-MM-yyyy') : 'N/A'}</TableCell>
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
    </div>
  );
}
