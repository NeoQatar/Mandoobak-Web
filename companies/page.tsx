
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
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
  Vendor,
} from '@/lib/vendors';
import { useLanguage } from '@/context/language-context';
import { Switch } from '@/components/ui/switch';

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
    username: 'Username',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    whatsappNumber: 'WhatsApp Number',
    emailAddress: 'Email Address',
    city: 'City',
    password: 'Password',
    processingServices: 'Processing Services',
    completedServices: 'Completed Services',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addVendorTitle: 'Add New Vendor',
    editVendorTitle: 'Edit Vendor',
    enterUsername: 'Enter username',
    enterFullName: 'Enter full name',
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
    username: 'اسم المستخدم',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    whatsappNumber: 'رقم الواتساب',
    emailAddress: 'عنوان البريد الإلكتروني',
    city: 'المدينة',
    password: 'كلمة المرور',
    processingServices: 'خدمات قيد المعالجة',
    completedServices: 'خدمات مكتملة',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addVendorTitle: 'إضافة بائع جديد',
    editVendorTitle: 'تعديل البائع',
    enterUsername: 'أدخل اسم المستخدم',
    enterFullName: 'أدخل الاسم الكامل',
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
  },
};

const FormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  whatsapp: z.string().min(1, 'WhatsApp number is required'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(1, 'City is required'),
  password: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});


type VendorFormValues = z.infer<typeof FormSchema> & {id?: string};

export default function CompaniesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  const [nameSearch, setNameSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      fullName: '',
      phone: '',
      whatsapp: '',
      email: '',
      city: '',
      password: '',
      status: 'Active',
    },
  });

  const fetchVendors = async () => {
    const data = await getVendors();
    setVendors(data);
    setFilteredVendors(data);
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
        v.username.toLowerCase().includes(nameSearch.toLowerCase()) ||
        v.fullName.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }
    if (phoneSearch) {
      result = result.filter((v) =>
        v.phone.includes(phoneSearch)
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
    // Apply filters immediately on change for a more reactive feel.
    // The "Apply" button is kept for explicit action if preferred.
    applyFilters();
  }, [nameSearch, phoneSearch, statusFilter, vendors]);


  const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const openAddDialog = () => {
    setEditingVendor(null);
    reset({ username: '', fullName: '', phone: '', whatsapp: '', email: '', city: '', password: '', status: 'Active' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (vendor: Vendor) => {
    setEditingVendor(vendor);
    reset({
      ...vendor,
      password: '', // Don't show existing password
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id!, data);
      } else {
        await createVendor({ ...data, processingServices: 0, completedServices: 0, password: data.password! });
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
        await deleteVendor(deletingVendorId);
        fetchVendors();
      } catch (error) {
        console.error('Failed to delete vendor:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingVendorId(null);
      }
    }
  };

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
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
          className="w-full md:w-auto"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhone}
          className="w-full md:w-auto"
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t.selectStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">{t.active}</SelectItem>
            <SelectItem value="Inactive">{t.inactive}</SelectItem>
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
                <TableHead>{t.username}</TableHead>
                <TableHead>{t.fullName}</TableHead>
                <TableHead>{t.phoneNumber}</TableHead>
                <TableHead>{t.whatsappNumber}</TableHead>
                <TableHead>{t.processingServices}</TableHead>
                <TableHead>{t.completedServices}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.username}</TableCell>
                  <TableCell>{vendor.fullName}</TableCell>
                  <TableCell><a href={`tel:${vendor.phone}`} className="hover:underline">{vendor.phone}</a></TableCell>
                  <TableCell><a href={`https://wa.me/${vendor.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{vendor.whatsapp}</a></TableCell>
                  <TableCell>{vendor.processingServices}</TableCell>
                  <TableCell>{vendor.completedServices}</TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(vendor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id!)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
              className="w-8 h-8 p-0"
            >
              {i + 1}
            </Button>
          ))}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? t.editVendorTitle : t.addVendorTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-1">
                    {t.username} *
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterUsername} />
                    )}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                    {t.fullName} *
                  </label>
                  <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterFullName} />
                    )}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    {t.phoneNumber} *
                  </label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterPhoneNumber} />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
                    {t.whatsappNumber} *
                  </label>
                  <Controller
                    name="whatsapp"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t.enterWhatsappNumber} />
                    )}
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-sm mt-1">{errors.whatsapp.message}</p>
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
    </div>
  );
}

