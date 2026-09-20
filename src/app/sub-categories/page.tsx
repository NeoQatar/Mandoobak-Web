
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
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  updateSubCategory,
  SubCategory,
} from '@/lib/sub-categories';
import { getCategories, Category } from '@/lib/categories';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { Switch } from '@/components/ui/switch';

const translations = {
  en: {
    allSubCategories: 'All Sub Categories',
    addNewSubCategory: 'Add New Sub Category',
    filter: 'Filter',
    searchSubCategories: 'Search sub categories',
    selectCategory: 'Select Category',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    categories: 'Categories',
    subCategories: 'Sub Categories',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addSubCategoryTitle: 'Add New Sub Category',
    editSubCategoryTitle: 'Edit Sub Category',
    subCategoryName: 'Sub Category Name',
    enterName: 'Enter name',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteSubCategoryTitle: 'Delete Sub Category',
    deleteSubCategoryMessage: 'Are you sure you want to delete this sub category? This action cannot be undone.',
    all: 'All',
    page: 'Page',
    of: 'of',
  },
  ar: {
    allSubCategories: 'كل الفئات الفرعية',
    addNewSubCategory: 'إضافة فئة فرعية جديدة',
    filter: 'تصفية',
    searchSubCategories: 'البحث في الفئات الفرعية',
    selectCategory: 'اختر الفئة',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    categories: 'الفئات',
    subCategories: 'الفئات الفرعية',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addSubCategoryTitle: 'إضافة فئة فرعية جديدة',
    editSubCategoryTitle: 'تعديل الفئة الفرعية',
    subCategoryName: 'اسم الفئة الفرعية',
    enterName: 'أدخل الاسم',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteSubCategoryTitle: 'حذف الفئة الفرعية',
    deleteSubCategoryMessage: 'هل أنت متأكد أنك تريد حذف هذه الفئة الفرعية؟ لا يمكن التراجع عن هذا الإجراء.',
    all: 'الكل',
    page: 'صفحة',
    of: 'من',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Sub Category name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['Active', 'Inactive']),
});

type SubCategoryFormValues = z.infer<typeof FormSchema>;

export default function SubCategoriesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [subCategoriesRaw, setSubCategories] = useState<SubCategory[]>([]);
  const subCategories = useTranslatedData(subCategoriesRaw);
  const [categoriesRaw, setCategories] = useState<Category[]>([]);
  const categories = useTranslatedData(categoriesRaw);
  const [activeCategoriesRaw, setActiveCategories] = useState<Category[]>([]);
  const activeCategories = useTranslatedData(activeCategoriesRaw);
  const [filteredSubCategoriesRaw, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const filteredSubCategories = useTranslatedData(filteredSubCategoriesRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingSubCategoryId, setDeletingSubCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', categoryId: '', status: 'Active' },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        const [subCategoriesData, categoriesData] = await Promise.all([getSubCategories(), getCategories()]);
        
        const subCategoriesWithCategoryNames = subCategoriesData.map(subCat => {
            const category = categoriesData.find(cat => cat.id === subCat.categoryId);
            return {
                ...subCat,
                categoryName: category?.name || 'N/A',
            }
        });
    
        setSubCategories(subCategoriesWithCategoryNames);
        setCategories(categoriesData);
        setActiveCategories(categoriesData.filter(cat => cat.status === 'Active'));
    } catch (error) {
        console.error("Failed to fetch sub categories:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = subCategories;
    if (searchTerm) {
      result = result.filter((sc) =>
        sc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter) {
        result = result.filter((sc) => sc.categoryId === categoryFilter);
    }
    if (statusFilter) {
      result = result.filter((sc) => sc.status === statusFilter);
    }
    setFilteredSubCategories(result);
  }, [searchTerm, categoryFilter, statusFilter, subCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredSubCategories.length / rowsPerPage));
  const paginatedSubCategories = filteredSubCategories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const openAddDialog = () => {
    setEditingSubCategory(null);
    reset({ name: '', categoryId: '', status: 'Active' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    reset({ name: subCategory.name, categoryId: subCategory.categoryId, status: subCategory.status });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: SubCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingSubCategory) {
        await updateSubCategory(editingSubCategory.id!, data);
      } else {
        await createSubCategory(data);
      }
      fetchData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save sub category:', error);
      alert(`Failed to save sub category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingSubCategoryId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingSubCategoryId) {
      try {
        await deleteSubCategory(deletingSubCategoryId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete sub category:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingSubCategoryId(null);
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  }

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allSubCategories}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewSubCategory}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Input
          placeholder={t.searchSubCategories}
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
                <TableHead>{t.categories}</TableHead>
                <TableHead>{t.subCategories}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading sub-categories...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedSubCategories.length > 0 ? (
                paginatedSubCategories.map((subCategory) => (
                  <TableRow key={subCategory.id}>
                    <TableCell>{subCategory.categoryName}</TableCell>
                    <TableCell>{subCategory.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={'outline'}
                        className={
                          subCategory.status === 'Active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {subCategory.status === 'Active' ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(subCategory)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(subCategory.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No sub-categories found.
                    </TableCell>
                </TableRow>
              )}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubCategory ? t.editSubCategoryTitle : t.addSubCategoryTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                {t.subCategoryName} *
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
                <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                    {t.categories} *
                </label>
                <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCategories.map(cat => <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
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
            <AlertDialogTitle>{t.deleteSubCategoryTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteSubCategoryMessage}
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
