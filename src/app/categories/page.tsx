
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
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  Category,
} from '@/lib/categories';
import { getDepartments, Department } from '@/lib/departments';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { Switch } from '@/components/ui/switch';

const translations = {
  en: {
    allCategories: 'All Categories',
    addNewCategory: 'Add New Categories',
    filter: 'Filter',
    searchCategories: 'Search categories',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    image: 'Image',
    categories: 'Categories',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addCategoryTitle: 'Add New Category',
    editCategoryTitle: 'Edit Category',
    categoryName: 'Category Name',
    enterTitle: 'Enter title',
    chooseFile: 'Choose File',
    noFileChosen: 'No file chosen',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    view: 'View',
    completed: 'Completed',
    inProgress: 'In Progress',
    underReview: 'Under Review',
    cancelled: 'Cancelled',
    deleteCategoryTitle: 'Delete Category',
    deleteCategoryMessage: 'Are you sure you want to delete this category? This action cannot be undone.',
    page: 'Page',
    of: 'of',
    department: 'Department',
    selectDepartment: 'Select Department',
  },
  ar: {
    allCategories: 'كل الفئات',
    addNewCategory: 'إضافة فئات جديدة',
    filter: 'تصفية',
    searchCategories: 'البحث في الفئات',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    image: 'صورة',
    categories: 'الفئات',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addCategoryTitle: 'إضافة فئة جديدة',
    editCategoryTitle: 'تعديل الفئة',
    categoryName: 'اسم الفئة',
    enterTitle: 'أدخل العنوان',
    chooseFile: 'اختر ملف',
    noFileChosen: 'لم يتم اختيار ملف',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    view: 'عرض',
    completed: 'مكتمل',
    inProgress: 'قيد التنفيذ',
    underReview: 'قيد المراجعة',
    cancelled: 'ملغى',
    deleteCategoryTitle: 'حذف الفئة',
    deleteCategoryMessage: 'هل أنت متأكد أنك تريد حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.',
    page: 'صفحة',
    of: 'من',
    department: 'القسم',
    selectDepartment: 'اختر القسم',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  departmentId: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type CategoryFormValues = z.infer<typeof FormSchema>;

export default function CategoriesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [categoriesRaw, setCategories] = useState<Category[]>([]);
  const categories = useTranslatedData(categoriesRaw);
  const [filteredCategoriesRaw, setFilteredCategories] = useState<Category[]>([]);
  const filteredCategories = useTranslatedData(filteredCategoriesRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentsRaw, setDepartments] = useState<Department[]>([]);
  const departments = useTranslatedData(departmentsRaw);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', departmentId: '', status: 'Active' },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
        const [catData, deptData] = await Promise.all([getCategories(), getDepartments()]);
        setDepartments(deptData);
        const deptMap = new Map(deptData.map(d => [d.id!, d.name]));
        const enriched = catData.map(c => ({
          ...c,
          departmentName: c.departmentId ? deptMap.get(c.departmentId) || '' : '',
        }));
        setCategories(enriched);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = categories;
    if (searchTerm) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFilteredCategories(result);
  }, [searchTerm, statusFilter, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / rowsPerPage));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageFile(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    reset({ name: '', departmentId: '', status: 'Active' });
    setImagePreview(null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    reset({ name: category.name, departmentId: category.departmentId || '', status: category.status });
    setImagePreview(category.imageUrl);
    setImageFile(null); // Reset image file on edit
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id!, data, imageFile);
      } else {
        await createCategory(data, imageFile);
      }
      fetchCategories();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(`Failed to save category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    setDeletingCategoryId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingCategoryId) {
      try {
        await deleteCategory(deletingCategoryId);
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingCategoryId(null);
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
  }

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allCategories}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewCategory}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Input
          placeholder={t.searchCategories}
          className="w-full md:w-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReset} className="bg-zinc-50">{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.image}</TableHead>
                <TableHead>{t.categories}</TableHead>
                <TableHead>{t.department}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading categories...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.departmentName || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={'outline'}
                        className={
                          category.status === 'Active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {category.status === 'Active' ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No categories found.
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
              {editingCategory ? t.editCategoryTitle : t.addCategoryTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="image" className="block text-sm font-medium mb-1">
                {t.image} *
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border rounded-md flex items-center justify-center">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="preview"
                      width={96}
                      height={96}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t.noFileChosen}</span>
                  )}
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                 <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>{t.chooseFile}</Button>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                {t.categoryName} *
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t.enterTitle} />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium mb-1">
                {t.department}
              </label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectDepartment} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.filter(d => d.status === 'Active').map((dept) => (
                        <SelectItem key={dept.id} value={dept.id!}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
            <AlertDialogTitle>{t.deleteCategoryTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteCategoryMessage}
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
