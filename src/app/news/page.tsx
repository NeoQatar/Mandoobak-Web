
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
  Calendar as CalendarIcon,
  GripVertical,
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
  createNews,
  deleteNews,
  getNews,
  updateNews,
  updateNewsOrder,
  News,
} from '@/lib/news';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/blog/rich-text-editor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    allNews: 'All News',
    addNew: 'Add New',
    searchNews: 'Search news',
    selectStatus: 'Select Status',
    reset: 'Reset',
    image: 'Image',
    title: 'Title',
    date: 'Date',
    status: 'Status',
    action: 'Action',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addTitle: 'Add New Article',
    editTitle: 'Edit Article',
    enterTitle: 'Enter title',
    description: 'Description',
    chooseFile: 'Choose File',
    noFileChosen: 'No file chosen',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteTitle: 'Delete Article',
    deleteMessage: 'Are you sure you want to delete this article? This action cannot be undone.',
    page: 'Page',
    of: 'of',
  },
  ar: {
    allNews: 'كل الأخبار',
    addNew: 'إضافة جديد',
    searchNews: 'البحث في الأخبار',
    selectStatus: 'اختر الحالة',
    reset: 'إعادة تعيين',
    image: 'صورة',
    title: 'العنوان',
    date: 'التاريخ',
    status: 'الحالة',
    action: 'إجراء',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addTitle: 'إضافة مقال جديد',
    editTitle: 'تعديل المقال',
    enterTitle: 'أدخل العنوان',
    description: 'الوصف',
    chooseFile: 'اختر ملف',
    noFileChosen: 'لم يتم اختيار ملف',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteTitle: 'حذف المقال',
    deleteMessage: 'هل أنت متأكد أنك تريد حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.',
    page: 'صفحة',
    of: 'من',
  },
};

const FormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.date({ required_error: "Date is required." }),
  status: z.enum(['Active', 'Inactive']),
});

type NewsFormValues = z.infer<typeof FormSchema>;

interface SortableNewsRowProps {
  article: News;
  t: any;
  onEdit: (article: News) => void;
  onDelete: (id: string, imageUrl: string) => void;
}

function SortableNewsRow({ article, t, onEdit, onDelete }: SortableNewsRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[50px]">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell>
        <Image
          src={article.imageUrl}
          alt={article.title}
          width={40}
          height={40}
          className="rounded-md"
        />
      </TableCell>
      <TableCell>{article.title}</TableCell>
      <TableCell>{format(new Date(article.date as any), 'dd-MM-yyyy')}</TableCell>
      <TableCell>
        <Badge
          variant={'outline'}
          className={
            article.status === 'Active'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-red-100 text-red-800 border-red-200'
          }
        >
          {article.status === 'Active' ? t.active : t.inactive}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(article)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(article.id!, article.imageUrl)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function NewsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [newsRaw, setNews] = useState<News[]>([]);
  const news = useTranslatedData(newsRaw);
  const [filteredNewsRaw, setFilteredNews] = useState<News[]>([]);
  const filteredNews = useTranslatedData(filteredNewsRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const [deletingNewsImage, setDeletingNewsImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setNews((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
        updateNewsOrder(updatedItems.map((i) => ({ id: i.id!, sortOrder: i.sortOrder! })))
          .catch(() => {
            toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
            fetchNews();
          });
        return updatedItems;
      });
    }
  };

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(FormSchema),
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
        const data = await getNews();
        setNews(data);
    } catch (error) {
        console.error("Failed to fetch news:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    let result = news;
    if (searchTerm) {
      result = result.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFilteredNews(result);
  }, [searchTerm, statusFilter, news]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / rowsPerPage));
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddDialog = () => {
    setEditingNews(null);
    reset({ title: '', description: '', date: new Date(), status: 'Active' });
    setImagePreview(null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (newsArticle: News) => {
    setEditingNews(newsArticle);
    reset({ title: newsArticle.title, description: newsArticle.description, date: new Date(newsArticle.date as any), status: newsArticle.status });
    setImagePreview(newsArticle.imageUrl);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: NewsFormValues) => {
    setIsSubmitting(true);
    const newsData = {
        ...data,
        date: data.date,
    }
    try {
      if (editingNews) {
        await updateNews(editingNews.id!, newsData, imageFile);
      } else {
        await createNews(newsData, imageFile, news.length);
      }
      fetchNews();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save article:', error);
      alert(`Failed to save article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string, imageUrl: string) => {
    setDeletingNewsId(id);
    setDeletingNewsImage(imageUrl);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingNewsId) {
      try {
        await deleteNews(deletingNewsId, deletingNewsImage || undefined);
        fetchNews();
      } catch (error) {
        console.error('Failed to delete article:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingNewsId(null);
        setDeletingNewsImage(null);
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
        <h1 className="text-2xl font-bold">{t.allNews}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNew}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Input
          placeholder={t.searchNews}
          className="w-full md:w-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReset} className="bg-zinc-50">{t.reset}</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t.image}</TableHead>
                <TableHead>{t.title}</TableHead>
                <TableHead>{t.date}</TableHead>
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
                          <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading news...</span>
                      </div>
                  </TableCell>
                </TableRow>
              ) : paginatedNews.length > 0 ? (
                <SortableContext
                  items={paginatedNews.map(a => a.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  {paginatedNews.map((article) => (
                    <SortableNewsRow
                      key={article.id}
                      article={article}
                      t={t}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No news articles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </DndContext>
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
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? t.editTitle : t.addTitle}
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
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                {t.title} *
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t.enterTitle} />
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                    {t.date} *
                </label>
                 <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "dd-MM-yyyy") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                {t.description} *
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor {...field} />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
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
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteMessage}
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
