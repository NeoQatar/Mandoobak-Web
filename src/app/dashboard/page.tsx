
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  TooltipProps,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader,
  TrendingUp,
  DollarSign,
  Percent,
  ListChecks,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import {
  getOrdersWithDetails,
  OrderWithDetails,
  OrderStatus,
  DocumentStatus,
  updateOrderStatuses,
} from '@/lib/orders';
import { getUsers, User } from '@/lib/users';
import { getServices, Service } from '@/lib/services';
import { getVendors, Vendor } from '@/lib/vendors';
import { format, parse, isValid, getMonth, getYear, getDate, subMonths, startOfMonth, endOfMonth, getDaysInMonth, parseISO } from 'date-fns';

const translations = {
  en: {
    dashboard: 'Dashboard',
    totalOrders: 'Total Orders',
    inProgressOrders: 'In Progress Orders',
    approvedOrders: 'Approved Orders',
    rejectedOrders: 'Rejected Orders',
    revenueUpdates: 'Revenue Updates',
    overviewOfProfit: 'Overview of Profit',
    monthlyEarnings: 'Monthly Earnings',
    lastMonth: 'last month',
    newCustomers: 'New Customers',
    pendingOrders: 'Pending Orders',
    filter: 'Filter',
    searchByUsername: 'Search by username',
    searchByPhone: 'Search by phone number',
    selectService: 'Select Service',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    orderId: 'Order ID',
    userName: 'User Name',
    phone: 'Phone Number',
    service: 'Service',
    status: 'Status',
    date: 'Date',
    assignedVendor: 'Assigned Vendor',
    'Order Created': 'Order Created',
    'Order Inprogress': 'Order Inprogress',
    'Order Completed': 'Order Completed',
    'Cancelled': 'Cancelled',
    'Documents Pending': 'Documents Pending',
    qar: 'QAR',
    loadingOrders: 'Loading orders...',
    vendorPerformance: 'Performance Overview',
    totalEarnings: 'Total Earnings',
    completionRate: 'Completion Rate',
    avgOrderValue: 'Avg. Order Value',
    activeServices: 'Active Services',
    earningsTrend: 'Earnings Trend',
    overviewOfEarnings: 'Overview of your earnings',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    totalOrders: 'إجمالي الطلبات',
    inProgressOrders: 'طلبات قيد التنفيذ',
    approvedOrders: 'الطلبات المعتمدة',
    rejectedOrders: 'الطلبات المرفوضة',
    revenueUpdates: 'تحديثات الإيرادات',
    overviewOfProfit: 'نظرة عامة على الأرباح',
    monthlyEarnings: 'الأرباح الشهرية',
    lastMonth: 'الشهر الماضي',
    newCustomers: 'عملاء جدد',
    pendingOrders: 'الطلبات المعلقة',
    filter: 'تصفية',
    searchByUsername: 'البحث باسم المستخدم',
    searchByPhone: 'البحث برقم الهاتف',
    selectService: 'اختر الخدمة',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    orderId: 'رقم الطلب',
    userName: 'اسم المستخدم',
    phone: 'رقم الهاتف',
    service: 'الخدمة',
    status: 'الحالة',
    date: 'التاريخ',
    assignedVendor: 'الشركة المسندة',
    'Order Created': 'تم إنشاء الطلب',
    'Order Inprogress': 'قيد التنفيذ',
    'Order Completed': 'مكتمل',
    'Cancelled': 'ملغى',
    'Documents Pending': 'في انتظار المستندات',
    qar: 'ريال قطري',
    loadingOrders: 'جاري تحميل الطلبات...',
    vendorPerformance: 'نظرة عامة على الأداء',
    totalEarnings: 'إجمالي الأرباح',
    completionRate: 'معدل الإنجاز',
    avgOrderValue: 'متوسط قيمة الطلب',
    activeServices: 'الخدمات النشطة',
    earningsTrend: 'اتجاه الأرباح',
    overviewOfEarnings: 'نظرة عامة على أرباحك',
  },
};


const StatusBadge = ({
    status,
    onStatusChange,
    t
  }: {
    status: OrderStatus;
    onStatusChange: (newStatus: OrderStatus) => void;
    t: (typeof translations)['en'];
  }) => {
    const statusStyles: Record<OrderStatus, string> = {
        'Order Created': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        'Order Inprogress': 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        'Order Completed': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    };
  
    const statusTranslations: Record<OrderStatus, string> = {
      'Order Created': t['Order Created'],
      'Order Inprogress': t['Order Inprogress'],
      'Order Completed': t['Order Completed'],
      'Cancelled': t.Cancelled,
    };
  
    const statusMenuColors: Record<OrderStatus, string> = {
      'Order Created': 'text-blue-500',
      'Order Inprogress': 'text-orange-500',
      'Order Completed': 'text-green-500',
      'Cancelled': 'text-red-500',
    }
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`flex items-center justify-between px-3 py-1 text-xs h-auto rounded-full border ${statusStyles[status]}`}
          >
            <span>{statusTranslations[status]}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(Object.keys(statusTranslations) as Array<OrderStatus>).map(statusKey => (
              <DropdownMenuItem 
                  key={statusKey} 
                  onClick={() => onStatusChange(statusKey)}
                  className={statusMenuColors[statusKey]}
              >
                  {statusTranslations[statusKey]}
              </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  

export default function DashboardPage() {
  const { language, direction } = useLanguage();
  const { dbUser, loading: authLoading } = useAuth();
  const t = translations[language];
  const isVendor = dbUser?.type === 'vendor';
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [usernameFilter, setUsernameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('2026');
  const [loading, setLoading] = useState(true);

  const fetchData = async (currentUser: User | null) => {
    setLoading(true);
    const currentIsVendor = currentUser?.type === 'vendor';
    const currentVendorId = currentUser?.userid || currentUser?.id;
    try {
        const ordersData = await getOrdersWithDetails();

        const vendorFilteredOrders = currentIsVendor && currentVendorId
            ? ordersData.filter(o => o.vendorId === currentVendorId)
            : currentIsVendor ? [] : ordersData;

        const sortedOrders = vendorFilteredOrders.sort((a, b) => {
            const idA = parseInt(a.orderId) || 0;
            const idB = parseInt(b.orderId) || 0;
            return idB - idA;
        });

        setOrders(sortedOrders);

        if (!currentIsVendor) {
            const [usersData, servicesData, vendorsData] = await Promise.all([
                getUsers(),
                getServices(),
                getVendors(),
            ]);
            setUsers(usersData);
            setServices(servicesData);
            setVendors(vendorsData);
        } else {
            const servicesData = await getServices();
            setServices(servicesData);
        }
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData(dbUser);
    }
  }, [authLoading, dbUser]);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const applyFilters = () => {
    let result = orders;
    if (usernameFilter) {
      result = result.filter((o) =>
        o.customerName.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }
    if (phoneFilter) {
      result = result.filter((o) => o.customerPhone.includes(phoneFilter));
    }
    if (serviceFilter) {
      result = result.filter((o) => o.serviceName === serviceFilter);
    }
    if (statusFilter) {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }
    setFilteredOrders(result);
  };

  useEffect(() => {
    applyFilters();
  }, [usernameFilter, phoneFilter, serviceFilter, statusFilter, orders]);

  const handleReset = () => {
    setUsernameFilter('');
    setPhoneFilter('');
    setServiceFilter('');
    setStatusFilter('');
  };
  
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
        await updateOrderStatuses(orderId, { orderStatus: newStatus });
        fetchData(dbUser);
    } catch (error) {
        console.error("Failed to update status:", error);
    }
  };


  const stats = {
    total: orders.length,
    inProgress: orders.filter((o) => o.orderStatus === 'Order Inprogress').length,
    approved: orders.filter((o) => o.orderStatus === 'Order Completed').length,
    rejected: orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  const vendorStats = isVendor ? (() => {
    const completed = orders.filter(o => o.orderStatus === 'Order Completed');
    const totalEarnings = completed.reduce((sum, o) => {
      const tp = o.totalPrice || 0;
      const cp = o.commissionpercent || 0;
      return sum + (tp - (tp * cp) / 100);
    }, 0);
    const completionRate = orders.length > 0
      ? Math.round((completed.length / orders.length) * 100)
      : 0;
    const avgOrderValue = completed.length > 0
      ? totalEarnings / completed.length
      : 0;
    const activeServiceCount = services.filter(s => s.vendorId === (dbUser?.userid || dbUser?.id) && s.status === 'Active').length;
    return { totalEarnings, completionRate, avgOrderValue, activeServiceCount };
  })() : null;
  
  const revenueData = Array(12).fill(0).map((_, i) => {
    const monthOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = typeof order.createdAt === 'string'
            ? parseISO(order.createdAt)
            : (order.createdAt && typeof (order.createdAt as any).toDate === 'function')
                ? (order.createdAt as any).toDate()
                : order.createdAt;
        return isValid(orderDate) && getYear(orderDate) === parseInt(yearFilter) && getMonth(orderDate) === i && order.orderStatus === 'Order Completed';
    });
    const total = monthOrders.reduce((acc, order) => {
        const tp = order.totalPrice || order.basePrice || 0;
        const cp = order.commissionpercent || 0;
        if (isVendor) {
            return acc + (tp - (tp * cp) / 100);
        }
        const commission = cp > 0 ? (tp * cp) / 100 : 0;
        return acc + commission;
    }, 0);
    return { name: format(new Date(parseInt(yearFilter), i), 'MMM'), value: total };
  });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = subMonths(now, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const calculateMonthlyRevenue = (month: number, year: number) => {
        return orders
            .filter(order => {
                if (!order.createdAt) return false;
                 const orderDate = typeof order.createdAt === 'string'
                    ? parseISO(order.createdAt)
                    : (order.createdAt && typeof (order.createdAt as any).toDate === 'function')
                        ? (order.createdAt as any).toDate()
                        : order.createdAt;
                return isValid(orderDate) && getMonth(orderDate) === month && getYear(orderDate) === year && order.orderStatus === 'Order Completed';
            })
            .reduce((acc, order) => {
                const tp = order.totalPrice || order.basePrice || 0;
                const cp = order.commissionpercent || 0;
                if (isVendor) {
                    return acc + (tp - (tp * cp) / 100);
                }
                const commission = cp > 0 ? (tp * cp) / 100 : 0;
                return acc + commission;
            }, 0);
    };

    const currentMonthRevenue = calculateMonthlyRevenue(currentMonth, currentYear);
    const lastMonthRevenue = calculateMonthlyRevenue(lastMonth, lastMonthYear);
    
    const monthlyEarningsChange = lastMonthRevenue > 0 
        ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : currentMonthRevenue > 0 ? 100 : 0;
    
    const daysInCurrentMonth = getDaysInMonth(now);
    const newCustomersData = Array.from({ length: daysInCurrentMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(currentYear, currentMonth, day);
        const customerCount = users.filter(user => {
            if (!user.createdAt) return false;
            const userCreationDate = new Date(user.createdAt);
            return isValid(userCreationDate) &&
                   userCreationDate.getFullYear() === currentYear &&
                   userCreationDate.getMonth() === currentMonth &&
                   userCreationDate.getDate() === day;
        }).length;
        return { date, value: customerCount };
    });

  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const monthIndex = revenueData.findIndex(d => d.name === label);
      const currentRevenue = payload[0].value || 0;
      const prevMonthRevenue = monthIndex > 0 ? revenueData[monthIndex - 1].value : 0;
      
      const percentageChange = prevMonthRevenue > 0 
        ? Math.round(((currentRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) 
        : currentRevenue > 0 ? 100 : 0;

      return (
        <div className="relative">
            <div className="p-4 rounded-lg" style={{backgroundColor: '#52002d', color: 'white'}}>
                <p className="text-sm">{`${format(new Date(parseInt(yearFilter), monthIndex), 'MMMM')}, ${yearFilter}`}</p>
                <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{`${t.qar} ${currentRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</p>
                    {percentageChange !== 0 && (
                        <div className={`flex items-center text-sm font-bold ${percentageChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {percentageChange}%
                        </div>
                    )}
                </div>
            </div>
            <div 
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #52002d',
                }}
            />
        </div>
      );
    }
    return null;
  };

  const NewCustomersTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = format(payload[0].payload.date, "MMMM, d yyyy");
      return (
        <div className="relative">
          <div className="p-2 px-4 rounded-lg flex items-center gap-2" style={{backgroundColor: '#52002d', color: 'white'}}>
            <span className="text-sm">{date}</span>
            <span className="font-bold text-sm">• {value}</span>
          </div>
          <div 
            className="absolute left-1/2 -translate-x-1/2"
            style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #52002d',
            }}
          />
        </div>
      );
    }
    return null;
  };

  const customTickFormatter = (tick: Date) => {
    return format(tick, 'd MMM');
  };


  return (
    <div className="p-4 md:p-8" dir={direction}>
      <h1 className="text-2xl font-bold mb-6">{t.dashboard}</h1>
      {isVendor && vendorStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-emerald-50 text-emerald-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.totalEarnings}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-3xl font-bold">{vendorStats.totalEarnings.toFixed(0)} <span className="text-base font-medium">{t.qar}</span></div>
              <div className="p-3 bg-emerald-200 rounded-full">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 text-purple-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.totalOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-xs mt-1">
                  <span className="text-green-600">{stats.approved} {t.approvedOrders.split(' ')[0]}</span>
                  {' • '}
                  <span className="text-orange-600">{stats.inProgress} {t.inProgressOrders.split(' ')[0]}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <ClipboardList className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 text-blue-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.completionRate}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-3xl font-bold">{vendorStats.completionRate}<span className="text-base font-medium">%</span></div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Percent className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-violet-50 text-violet-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.activeServices}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold">{vendorStats.activeServiceCount}</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {t.avgOrderValue}: {vendorStats.avgOrderValue.toFixed(0)} {t.qar}
                </div>
              </div>
              <div className="p-3 bg-violet-200 rounded-full">
                <ListChecks className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-purple-50 text-purple-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.totalOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-4xl font-bold">{stats.total}</div>
              <div className="p-3 bg-purple-200 rounded-full">
                <ClipboardList className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 text-orange-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.inProgressOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-4xl font-bold">{stats.inProgress}</div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Loader className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 text-green-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.approvedOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-4xl font-bold">{stats.approved}</div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 text-red-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.rejectedOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="text-4xl font-bold">{stats.rejected}</div>
              <div className="p-3 bg-red-200 rounded-full">
                <XCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>{isVendor ? t.earningsTrend : t.revenueUpdates}</CardTitle>
                <CardDescription>{isVendor ? t.overviewOfEarnings : t.overviewOfProfit}</CardDescription>
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full md:w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8d1b3d" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8d1b3d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Area type="monotone" dataKey="value" stroke="#8d1b3d" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t.monthlyEarnings}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-4">
                    <div>
                        <div className="text-3xl font-bold">{t.qar} {currentMonthRevenue.toLocaleString()}</div>
                        <div className={`text-sm ${monthlyEarningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <span className="inline-block align-middle">{monthlyEarningsChange >= 0 ? '▲' : '▼'}</span> {Math.abs(monthlyEarningsChange)}% {t.lastMonth}
                        </div>
                    </div>
                    <div className="w-40 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="80%" outerRadius="100%" data={[{ value: Math.abs(monthlyEarningsChange) }]} startAngle={90} endAngle={450}>
                                <RadialBar dataKey="value" fill="#8d1b3d" background={{ fill: '#eee' }} cornerRadius={10} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-foreground">{Math.abs(monthlyEarningsChange)}%</text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
             {!isVendor && (
             <Card>
                <CardHeader>
                    <CardTitle>{t.newCustomers}</CardTitle>
                </CardHeader>
                <CardContent className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={newCustomersData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8d1b3d" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#8d1b3d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                interval={6}
                                tickFormatter={customTickFormatter}
                            />
                             <Tooltip
                                content={<NewCustomersTooltip />}
                                cursor={{ fill: 'transparent' }}
                             />
                            <Area type="monotone" dataKey="value" stroke="#8d1b3d" fill="url(#colorCustomers)" strokeWidth={1.5} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">{t.pendingOrders}</h2>
       <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Input
          placeholder={t.searchByUsername}
          className="w-full sm:w-auto"
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhone}
          className="w-full sm:w-auto"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
        />
        <Select value={serviceFilter || undefined} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.selectService} />
          </SelectTrigger>
          <SelectContent>
            {services.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.selectStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Order Created">{t['Order Created']}</SelectItem>
            <SelectItem value="Order Inprogress">{t['Order Inprogress']}</SelectItem>
            <SelectItem value="Order Completed">{t['Order Completed']}</SelectItem>
            <SelectItem value="Cancelled">{t.Cancelled}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button onClick={applyFilters} className="w-full sm:w-auto">{t.apply}</Button>
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t.orderId}</TableHead>
                        <TableHead>{t.userName}</TableHead>
                        <TableHead>{t.phone}</TableHead>
                        <TableHead>{t.service}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead>{t.date}</TableHead>
                        <TableHead>{t.assignedVendor}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-muted-foreground text-sm font-medium animate-pulse">{t.loadingOrders}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (filteredOrders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>{order.orderId}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>
                                <a href={`tel:${order.customerPhone}`} className="hover:underline">{order.customerPhone}</a>
                            </TableCell>
                            <TableCell>{order.serviceName}</TableCell>
                            <TableCell>
                                <StatusBadge status={order.orderStatus} onStatusChange={(newStatus) => handleStatusChange(order.id!, newStatus as OrderStatus)} t={t} />
                            </TableCell>
                            <TableCell>{order.createdAt 
                                ? format(
                                    typeof order.createdAt === 'string' 
                                        ? parseISO(order.createdAt) 
                                        : (order.createdAt && typeof (order.createdAt as any).toDate === 'function')
                                            ? (order.createdAt as any).toDate()
                                            : order.createdAt as any, 
                                    'dd-MM-yyyy'
                                  ) 
                                : '-'}</TableCell>
                            <TableCell>{order.vendorName}</TableCell>
                        </TableRow>
                    )))}
                    {!loading && filteredOrders.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                No pending orders found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
