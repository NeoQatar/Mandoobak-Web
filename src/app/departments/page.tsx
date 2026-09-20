
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
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  Department,
} from '@/lib/departments';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { Switch } from '@/components/ui/switch';

const translations = {
  en: {
    allDepartments: 'All Departments',
    addNewDepartment: 'Add New Department',
    filter: 'Filter',
    searchDepartments: 'Search departments',
    selectStatus: 'Select Status',
    apply: 'Apply',
    reset: 'Reset',
    image: 'Image',
    departments: 'Departments',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addDepartmentTitle: 'Add New Department',
    editDepartmentTitle: 'Edit Department',
    departmentName: 'Department Name',
    enterTitle: 'Enter title',
    chooseFile: 'Choose File',
    noFileChosen: 'No file chosen',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteDepartmentTitle: 'Delete Department',
    deleteDepartmentMessage: 'Are you sure you want to delete this department? This action cannot be undone.',
    page: 'Page',
    of: 'of',
  },
  ar: {
    allDepartments: 'كل الأقسام',
    addNewDepartment: 'إضافة قسم جديد',
    filter: 'تصفية',
    searchDepartments: 'البحث في الأقسام',
    selectStatus: 'اختر الحالة',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    image: 'صورة',
    departments: 'الأقسام',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addDepartmentTitle: 'إضافة قسم جديد',
    editDepartmentTitle: 'تعديل القسم',
    departmentName: 'اسم القسم',
    enterTitle: 'أدخل العنوان',
    chooseFile: 'اختر ملف',
    noFileChosen: 'لم يتم اختيار ملف',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteDepartmentTitle: 'حذف القسم',
    deleteDepartmentMessage: 'هل أنت متأكد أنك تريد حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.',
    page: 'صفحة',
    of: 'من',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  status: z.enum(['Active', 'Inactive']),
});

type DepartmentFormValues = z.infer<typeof FormSchema>;

export default function DepartmentsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [departmentsRaw, setDepartments] = useState<Department[]>([]);
  const departments = useTranslatedData(departmentsRaw);
  const [filteredDepartmentsRaw, setFilteredDepartments] = useState<Department[]>([]);
  const filteredDepartments = useTranslatedData(filteredDepartmentsRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', status: 'Active' },
  });

  const fetchDepartments = async (fromServer = false) => {
    setLoading(true);
    try {
        const data = await getDepartments({ fromServer });
        setDepartments(data);
    } catch (error) {
        console.error("Failed to fetch departments:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = departments;
    if (searchTerm) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFilteredDepartments(result);
  }, [searchTerm, statusFilter, departments]);

  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / rowsPerPage));
  const paginatedDepartments = filteredDepartments.slice(
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
    setEditingDepartment(null);
    reset({ name: '', status: 'Active' });
    setImagePreview(null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    reset({ name: department.name, status: department.status });
    setImagePreview(department.imageUrl);
    setImageFile(null); // Reset image file on edit
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingDepartment) {
        const result = await updateDepartment(editingDepartment.id!, data, imageFile);
        setDepartments((prev) =>
          prev.map((department) =>
            department.id === editingDepartment.id
              ? { ...department, ...data, imageUrl: result.imageUrl }
              : department
          )
        );
      } else {
        await createDepartment(data, imageFile);
      }
      await fetchDepartments(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save department:', error);
      alert(`Failed to save department: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    setDeletingDepartmentId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingDepartmentId) {
      try {
        await deleteDepartment(deletingDepartmentId);
        fetchDepartments();
      } catch (error) {
        console.error('Failed to delete department:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingDepartmentId(null);
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
        <h1 className="text-2xl font-bold">{t.allDepartments}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewDepartment}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Input
          placeholder={t.searchDepartments}
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
                <TableHead>{t.departments}</TableHead>
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
                        <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading departments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedDepartments.length > 0 ? (
                paginatedDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      {department.imageUrl ? (
                        <div className="relative w-10 h-10">
                          <Image
                            key={`${department.id}-${department.imageUrl}`}
                            src={department.imageUrl}
                            alt={department.name}
                            fill
                            className="rounded-md object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground border">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={'outline'}
                        className={
                          department.status === 'Active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {department.status === 'Active' ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(department)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(department.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No departments found.
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
              {editingDepartment ? t.editDepartmentTitle : t.addDepartmentTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="image" className="block text-sm font-medium mb-1">
                {t.image} *
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
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
                {t.departmentName} *
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
            <AlertDialogTitle>{t.deleteDepartmentTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteDepartmentMessage}
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
