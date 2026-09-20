
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Eye,
  ShieldCheck,
  FileUp,
  FileCheck,
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  User,
  getVendorsFromUsers,
} from '@/lib/users';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { toast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/firebaseService/storage';
import { Switch } from '@/components/ui/switch';
import { auth } from '@/lib/firebase';
import { logActivity } from '@/lib/activity-logs';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getOrdersWithDetails } from '@/lib/orders';
import { getServices, assignVendorToService, unassignVendorFromService, updateVendorCommission, Service } from '@/lib/services';
import { Checkbox } from '@/components/ui/checkbox';

const translations = {
  en: {
    allVendors: 'All Vendors',
    addNewVendor: 'Add New Vendor',
    filter: 'Filter',
    searchByName: 'Search by name',
    searchByPhone: 'Search by phone number',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    name: 'Name',
    phoneNumber: 'Phone Number',
    whatsappNumber: 'WhatsApp Number',
    emailAddress: 'Email Address',
    city: 'City',
    password: 'Password',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addVendorTitle: 'Add New Vendor',
    editVendorTitle: 'Edit Vendor',
    enterName: 'Enter name',
    enterPhoneNumber: 'Enter phone number',
    enterWhatsappNumber: 'Enter WhatsApp number',
    enterEmail: 'Enter email address',
    selectCity: 'Select city',
    enterPassword: 'Enter password',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteVendorTitle: 'Delete Vendor',
    deleteVendorMessage: 'Are you sure you want to delete this vendor? This action cannot be undone.',
    page: 'Page',
    of: 'of',
    processingServices: 'Processing Services',
    completedServices: 'Completed Services',
    crDoc: 'CR - Commercial Registration',
    cpDoc: 'CP - Commercial Permit/License',
    eidDoc: 'EID - Electronic ID',
    mouDoc: 'MOU / Agreement',
    documents: 'Documents',
    uploadDocument: 'Upload Document',
    uploaded: 'Uploaded',
    changeRole: 'Change Role',
    admin: 'Admin',
    manager: 'Manager',
    vendor: 'Vendor',
    customer: 'Customer',
    roleChangedSuccess: 'Role changed successfully.',
    roleChangedError: 'Failed to change role.',
    role: 'Role',
    assignServices: 'Assign Services',
    serviceName: 'Service',
    basePrice: 'Base Price',
    commission: 'Commission %',
    noServicesAvailable: 'No services available',
  },
  ar: {
    allVendors: 'كل البائعين',
    addNewVendor: 'إضافة بائع جديد',
    filter: 'تصفية',
    searchByName: 'البحث بالاسم',
    searchByPhone: 'البحث برقم الهاتف',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    name: 'الاسم',
    phoneNumber: 'رقم الهاتف',
    whatsappNumber: 'رقم الواتساب',
    emailAddress: 'عنوان البريد الإلكتروني',
    city: 'المدينة',
    password: 'كلمة المرور',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addVendorTitle: 'إضافة بائع جديد',
    editVendorTitle: 'تعديل البائع',
    enterName: 'أدخل الاسم',
    enterPhoneNumber: 'أدخل رقم الهاتف',
    enterWhatsappNumber: 'أدخل رقم الواتساب',
    enterEmail: 'أدخل عنوان البريد الإلكتروني',
    selectCity: 'اختر المدينة',
    enterPassword: 'أدخل كلمة المرور',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteVendorTitle: 'حذف البائع',
    deleteVendorMessage: 'هل أنت متأكد أنك تريد حذف هذا البائع؟ لا يمكن التراجع عن هذا الإجراء.',
    page: 'صفحة',
    of: 'من',
    processingServices: 'خدمات قيد المعالجة',
    completedServices: 'خدمات مكتملة',
    crDoc: 'السجل التجاري',
    cpDoc: 'الرخصة التجارية',
    eidDoc: 'الهوية الإلكترونية',
    mouDoc: 'مذكرة تفاهم / اتفاقية',
    documents: 'المستندات',
    uploadDocument: 'تحميل المستند',
    uploaded: 'تم التحميل',
    changeRole: 'تغيير الدور',
    admin: 'مسؤول',
    manager: 'مدير',
    vendor: 'بائع',
    customer: 'عميل',
    roleChangedSuccess: 'تم تغيير الدور بنجاح.',
    roleChangedError: 'فشل في تغيير الدور.',
    role: 'الدور',
    assignServices: 'تعيين الخدمات',
    serviceName: 'الخدمة',
    basePrice: 'السعر الأساسي',
    commission: 'نسبة العمولة',
    noServicesAvailable: 'لا توجد خدمات متاحة',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(1, 'City is required'),
  password: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});


type VendorFormValues = z.infer<typeof FormSchema> & {id?: string};

export default function VendorsPage() {
  const { language, direction } = useLanguage();
  const { dbUser } = useAuth();
  const t = translations[language];
  const router = useRouter();

  const [vendorsRaw, setVendors] = useState<User[]>([]);
  const vendors = useTranslatedData(vendorsRaw);
  const [filteredVendorsRaw, setFilteredVendors] = useState<User[]>([]);
  const filteredVendors = useTranslatedData(filteredVendorsRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<User | null>(null);
  
  const [nameSearch, setNameSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({ cr: null, cp: null, eid: null, mou: null });
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceCommissions, setServiceCommissions] = useState<Record<string, number>>({});
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleChangeVendor, setRoleChangeVendor] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      city: '',
      password: '',
      status: 'Active',
    },
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
        const [vendorsData, ordersData, servicesData] = await Promise.all([
          getVendorsFromUsers(),
          getOrdersWithDetails(),
          getServices(),
        ]);

        setAllServices(servicesData);

        const vendorsWithStats = vendorsData.map(vendor => {
          const vendorOrders = ordersData.filter(order => order.vendorId === vendor.userid);
          return {
            ...vendor,
            processingServices: vendorOrders.filter(o => o.orderStatus === 'Order Inprogress').length,
            completedServices: vendorOrders.filter(o => o.orderStatus === 'Order Completed').length,
          };
        });

        setVendors(vendorsWithStats);
        setFilteredVendors(vendorsWithStats);
    } catch (error) {
        console.error("Failed to fetch vendors:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const applyFilters = () => {
    let result = vendors;
    if (nameSearch) {
      result = result.filter((v) =>
        v.name.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }
    if (phoneSearch) {
      result = result.filter((v) =>
        v.phoneNumber.includes(phoneSearch)
      );
    }
    if (statusFilter) {
      result = result.filter((v) => v.status === statusFilter);
    }
    setFilteredVendors(result);
  }

  const handleReset = () => {
    setNameSearch('');
    setPhoneSearch('');
    setStatusFilter('');
    setFilteredVendors(vendors);
  }

  useEffect(() => {
    applyFilters();
  }, [nameSearch, phoneSearch, statusFilter, vendors]);


  const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const openAddDialog = () => {
    setEditingVendor(null);
    reset({ name: '', phoneNumber: '', email: '', city: '', password: '', status: 'Active' });
    setDocFiles({ cr: null, cp: null, eid: null, mou: null });
    setSelectedServiceIds(new Set());
    setServiceCommissions({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (vendor: User) => {
    setEditingVendor(vendor);
    reset({ ...vendor, password: '' });
    setDocFiles({ cr: null, cp: null, eid: null, mou: null });
    const vendorUid = vendor.userid || vendor.id!;
    const assigned = allServices.filter(s => {
      const ids = new Set([...(s.vendorIds || []), ...(s.vendorId ? [s.vendorId] : [])]);
      return ids.has(vendorUid);
    });
    setSelectedServiceIds(new Set(assigned.map(s => s.id!)));
    const commissions: Record<string, number> = {};
    assigned.forEach(s => {
      commissions[s.id!] = s.vendorCommissions?.[vendorUid] ?? s.commissionPercent ?? 0;
    });
    setServiceCommissions(commissions);
    setIsDialogOpen(true);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [key]: file }));
  };

  const uploadDocFile = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const url = await uploadFile(reader.result as string, path);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      const docUrls: Record<string, string> = {};
      const vendorId = editingVendor?.id || 'new';

      for (const [key, file] of Object.entries(docFiles)) {
        if (file) {
          const url = await uploadDocFile(file, `vendors/${vendorId}/${key}_${file.name}`);
          docUrls[`${key}DocUrl`] = url;
        }
      }

      const updateData = { ...data, ...docUrls };

      let vendorUserId: string;

      if (editingVendor) {
        await updateUser(editingVendor.id!, updateData);
        vendorUserId = editingVendor.userid || editingVendor.id!;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
        await createUser(userCredential.user.uid, data.name, data.email, 'vendor', data.city, data.phoneNumber);
        if (Object.keys(docUrls).length > 0) {
          await updateUser(userCredential.user.uid, { ...docUrls });
        }
        vendorUserId = userCredential.user.uid;
      }

      // Update service assignments and commissions (multi-vendor)
      const serviceUpdates: Promise<void>[] = [];
      for (const service of allServices) {
        const isSelected = selectedServiceIds.has(service.id!);
        const existingIds = new Set([...(service.vendorIds || []), ...(service.vendorId ? [service.vendorId] : [])]);
        const wasAssigned = existingIds.has(vendorUserId);
        const commission = serviceCommissions[service.id!] ?? 0;
        if (isSelected && !wasAssigned) {
          serviceUpdates.push(assignVendorToService(service.id!, vendorUserId, commission));
        } else if (!isSelected && wasAssigned) {
          serviceUpdates.push(unassignVendorFromService(service.id!, vendorUserId));
        } else if (isSelected && wasAssigned) {
          const prevCommission = service.vendorCommissions?.[vendorUserId] ?? service.commissionPercent ?? 0;
          if (commission !== prevCommission) {
            serviceUpdates.push(updateVendorCommission(service.id!, vendorUserId, commission));
          }
        }
      }
      if (serviceUpdates.length > 0) {
        await Promise.all(serviceUpdates);
      }

      fetchVendors();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save vendor:', error);
      alert(`Failed to save vendor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    setDeletingVendorId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingVendorId) {
      try {
        await deleteUser(deletingVendorId);
        fetchVendors();
      } catch (error) {
        console.error('Failed to delete vendor:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingVendorId(null);
      }
    }
  };

  const roleLabels: Record<string, string> = {
    admin: t.admin, manager: t.manager, vendor: t.vendor, customer: t.customer,
  };

  const openRoleDialog = (vendor: User) => {
    setRoleChangeVendor(vendor);
    setSelectedRole(vendor.type || 'vendor');
    setIsRoleDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!roleChangeVendor) return;
    try {
      await updateUser(roleChangeVendor.id!, { type: selectedRole as any });
      await logActivity({
        action: 'Role Changed',
        description: `Changed role from ${roleChangeVendor.type} to ${selectedRole}`,
        performedBy: dbUser?.userid || dbUser?.id || '',
        performedByName: dbUser?.name || '',
        performedByRole: dbUser?.type || 'admin',
        targetUserId: roleChangeVendor.userid || roleChangeVendor.id,
        targetUserName: roleChangeVendor.name,
        category: 'vendor',
      });
      toast({ title: t.roleChangedSuccess });
      fetchVendors();
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Failed to change role:', error);
      toast({ title: t.roleChangedError, variant: 'destructive' });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const number = phone.replace('+', '');
    if (number.startsWith('974')) {
        return `+974 ${number.substring(3)}`;
    }
    if (number.startsWith('91')) {
        return `+91 ${number.substring(2)}`;
    }
    return phone;
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allVendors}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewVendor}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Input
          placeholder={t.searchByName}
          className="w-full sm:w-auto"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhone}
          className="w-full sm:w-auto"
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
        />
         <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">{t.active}</SelectItem>
            <SelectItem value="Inactive">{t.inactive}</SelectItem>
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
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.phoneNumber}</TableHead>
                <TableHead className="text-center">{t.processingServices}</TableHead>
                <TableHead className="text-center">{t.completedServices}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading vendors...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedVendors.length > 0 ? (
                paginatedVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell><a href={`tel:${vendor.phoneNumber}`} className="hover:underline">{formatPhoneNumber(vendor.phoneNumber)}</a></TableCell>
                    <TableCell className="text-center">{vendor.processingServices}</TableCell>
                    <TableCell className="text-center">{vendor.completedServices}</TableCell>
                    <TableCell>
                      <Badge
                          variant={'outline'}
                          className={
                              vendor.status === 'Active'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }
                          >
                          {vendor.status === 'Active' ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openRoleDialog(vendor)} title={t.changeRole}>
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => router.push(`/vendors/${vendor.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(vendor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No vendors found.
                  </TableCell>
                </TableRow>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? t.editVendorTitle : t.addVendorTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {t.name} *
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterName} />
                    )}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                    {t.phoneNumber} *
                  </label>
                  <Controller
                    name="phoneNumber"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterPhoneNumber} />
                    )}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                        {t.emailAddress} *
                    </label>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                        <Input {...field} type="email" placeholder={t.enterEmail} />
                        )}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                        {t.city} *
                    </label>
                    <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.selectCity} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Doha">Doha</SelectItem>
                                    <SelectItem value="Al Rayyan">Al Rayyan</SelectItem>
                                    <SelectItem value="Al Wakrah">Al Wakrah</SelectItem>
                                    <SelectItem value="Al Khor">Al Khor</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                        {t.password} {editingVendor ? '' : '*'}
                    </label>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                        <Input {...field} type="password" placeholder={editingVendor ? "Enter new password (optional)" : t.enterPassword} autoComplete="new-password"/>
                        )}
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                </div>
            </div>

            {/* Document Upload Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['cr', 'cp', 'eid', 'mou'] as const).map((key) => {
                const labels: Record<string, string> = { cr: t.crDoc, cp: t.cpDoc, eid: t.eidDoc, mou: t.mouDoc };
                const urlKey = `${key}DocUrl` as keyof User;
                const hasExisting = editingVendor && editingVendor[urlKey];
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{labels[key]}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                        className="text-xs"
                      />
                      {docFiles[key] ? (
                        <FileCheck className="h-4 w-4 text-green-500 shrink-0" />
                      ) : hasExisting ? (
                        <FileCheck className="h-4 w-4 text-blue-500 shrink-0" title={t.uploaded} />
                      ) : (
                        <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assign Services */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.assignServices}</label>
              {allServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noServicesAvailable}</p>
              ) : (
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>{t.serviceName}</TableHead>
                        <TableHead className="text-center">{t.basePrice}</TableHead>
                        <TableHead className="text-center">{t.commission}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allServices.map(service => {
                        const isSelected = selectedServiceIds.has(service.id!);
                        const assignedCount = new Set([...(service.vendorIds || []), ...(service.vendorId ? [service.vendorId] : [])]).size;
                        return (
                          <TableRow key={service.id}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleServiceSelection(service.id!)}
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {service.name}
                              {assignedCount > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({assignedCount} vendor{assignedCount > 1 ? 's' : ''})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">{service.basePrice || 0} QAR</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="w-[70px] h-7 text-center text-sm mx-auto"
                                value={serviceCommissions[service.id!] ?? 0}
                                disabled={!isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                  setServiceCommissions(prev => ({ ...prev, [service.id!]: val }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                {t.status}
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={field.value === 'Active'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'Active' : 'Inactive')
                      }
                    />
                    <label htmlFor="status">{field.value === 'Active' ? t.active : t.inactive}</label>
                  </div>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.saveChanges
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteVendorTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteVendorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t.changeRole} - {roleChangeVendor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t.admin}</SelectItem>
                <SelectItem value="manager">{t.manager}</SelectItem>
                <SelectItem value="vendor">{t.vendor}</SelectItem>
                <SelectItem value="customer">{t.customer}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleRoleChange}>{t.saveChanges}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
