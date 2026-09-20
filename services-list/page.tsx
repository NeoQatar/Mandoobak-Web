
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
  DialogDescription
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
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createService,
  deleteService,
  getServices,
  updateService,
  Service,
} from '@/lib/services';
import { getCategories, Category } from '@/lib/categories';
import { getSubCategories, SubCategory } from '@/lib/sub-categories';
import { useLanguage } from '@/context/language-context';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const translations = {
  en: {
    allServices: 'All Services',
    addNewService: 'Add New Service',
    filter: 'Filter',
    searchServices: 'Search services',
    selectCategory: 'Select Category',
    selectSubCategory: 'Select Sub Category',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    departments: 'Departments',
    categories: 'Categories',
    subCategories: 'Sub Categories',
    services: 'Services',
    price: 'Price',
    discount: 'Discount',
    totalPrice: 'Total Price',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addServiceTitle: 'Add New Service',
    editServiceTitle: 'Edit Service',
    serviceName: 'Service Name',
    description: 'Description',
    enterName: 'Enter name',
    enterDescription: 'Enter description',
    enterPrice: 'Enter price',
    enterDiscount: 'Enter discount (optional)',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteServiceTitle: 'Delete Service',
    deleteServiceMessage: 'Are you sure you want to delete this service? This action cannot be undone.',
    all: 'All',
    qar: 'QAR',
    basePrice: 'Base Price',
    page: 'Page',
    of: 'of',
  },
  ar: {
    allServices: 'كل الخدمات',
    addNewService: 'إضافة خدمة جديدة',
    filter: 'تصفية',
    searchServices: 'البحث في الخدمات',
    selectCategory: 'اختر الفئة',
    selectSubCategory: 'اختر الفئة الفرعية',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    departments: 'الأقسام',
    categories: 'الفئات',
    subCategories: 'الفئات الفرعية',
    services: 'الخدمات',
    price: 'السعر',
    discount: 'الخصم',
    totalPrice: 'السعر الإجمالي',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addServiceTitle: 'إضافة خدمة جديدة',
    editServiceTitle: 'تعديل الخدمة',
    serviceName: 'اسم الخدمة',
    description: 'الوصف',
    enterName: 'أدخل الاسم',
    enterDescription: 'أدخل الوصف',
    enterPrice: 'أدخل السعر',
    enterDiscount: 'أدخل الخصم (اختياري)',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteServiceTitle: 'حذف الخدمة',
    deleteServiceMessage: 'هل أنت متأكد أنك تريد حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.',
    all: 'الكل',
    qar: 'ريال قطري',
    basePrice: 'السعر الأساسي',
    page: 'صفحة',
    of: 'من',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub Category is required'),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Price must be a positive number')
  ),
  discount: z.preprocess(
    (a) => (a === '' ? undefined : parseFloat(z.string().parse(a))),
    z.number().nonnegative('Discount must be a non-negative number').optional()
  ),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['Active', 'Inactive']),
});

type ServiceFormValues = z.infer<typeof FormSchema>;

export default function ServicesListPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const fetchData = async () => {
    const [servicesData, categoriesData, subCategoriesData] = await Promise.all([
      getServices(), 
      getCategories(),
      getSubCategories()
    ]);
    
    const servicesWithDetails = servicesData.map(service => {
        const category = categoriesData.find(cat => cat.id === service.categoryId);
        const subCategory = subCategoriesData.find(subCat => subCat.id === service.subCategoryId);
        return {
            ...service,
            categoryName: category?.name || 'N/A',
            subCategoryName: subCategory?.name || 'N/A',
        }
    });

    setServices(servicesWithDetails);
    setCategories(categoriesData);
    setActiveCategories(categoriesData.filter(cat => cat.status === 'Active'));
    setSubCategories(subCategoriesData);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = services;
    if (searchTerm) {
      result = result.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter) {
        result = result.filter((s) => s.categoryId === categoryFilter);
    }
    if (subCategoryFilter) {
        result = result.filter((s) => s.subCategoryId === subCategoryFilter);
    }
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }
    setFilteredServices(result);
  }, [searchTerm, categoryFilter, subCategoryFilter, statusFilter, services]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / rowsPerPage));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const openAddDialog = () => {
    router.push('/services-list/new');
  };

  const openEditDialog = (service: Service) => {
    router.push(`/services-list/new?serviceId=${service.id}&formId=${service.formId || ''}`);
  };


  const handleDelete = async (id: string) => {
    setDeletingServiceId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingServiceId) {
      try {
        await deleteService(deletingServiceId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete service:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingServiceId(null);
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSubCategoryFilter('');
    setStatusFilter('');
  }

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allServices}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewService}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Input
          placeholder={t.searchServices}
          className="w-full md:w-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.selectCategory} />
            </SelectTrigger>
            <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.selectSubCategory} />
            </SelectTrigger>
            <SelectContent>
                {subCategories.filter(sc => !categoryFilter || sc.categoryId === categoryFilter).map(subCat => <SelectItem key={subCat.id} value={subCat.id!}>{subCat.name}</SelectItem>)}
            </SelectContent>
        </Select>
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
          <Button variant="ghost" onClick={handleReset} className="bg-zinc-50">{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.services}</TableHead>
                <TableHead>{t.departments}</TableHead>
                <TableHead>{t.categories}</TableHead>
                <TableHead>{t.subCategories}</TableHead>
                <TableHead>{t.basePrice}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.map((service) => (
                <TableRow key={service.id}>
                    <TableCell className="flex items-center gap-2">
                        {service.imageUrl && <Image src={service.imageUrl} alt={service.name} width={40} height={40} className="rounded-md" />}
                        <span>{service.name}</span>
                    </TableCell>
                  <TableCell>{service.departmentName || 'N/A'}</TableCell>
                  <TableCell>{service.categoryName}</TableCell>
                  <TableCell>{service.subCategoryName}</TableCell>
                  <TableCell>{service.basePrice} {t.qar}</TableCell>
                  <TableCell>
                    <Badge
                      variant={'outline'}
                      className={
                        service.status === 'Active'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {service.status === 'Active' ? t.active : t.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id!)}>
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
            <AlertDialogTitle>{t.deleteServiceTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteServiceMessage}
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
