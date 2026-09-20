
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
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ALL_PERMISSIONS } from '@/lib/types';
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
} from '@/lib/users';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const translations = {
  en: {
    allUsers: 'All Users',
    addNewUser: 'Add New User',
    filter: 'Filter',
    searchByUsername: 'Search by username',
    searchByPhoneNumber: 'Search by phone number',
    apply: 'Apply',
    reset: 'Reset',
    slNo: 'Sl no',
    userName: 'User Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    action: 'Action',
    edit: 'Edit',
    delete: 'Delete',
    rowsPerPage: 'Rows per page',
    addUserTitle: 'Add New User',
    editUserTitle: 'Edit User',
    enterUsername: 'Enter username',
    enterPhoneNumber: 'Enter phone number',
    enterEmail: 'Enter email address',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    deleteUserTitle: 'Delete User',
    deleteUserMessage: 'Are you sure you want to delete this user? This action cannot be undone.',
    page: 'Page',
    of: 'of',
    role: 'Role',
    changeRole: 'Change Role',
    admin: 'Admin',
    manager: 'Manager',
    vendor: 'Vendor',
    customer: 'User',
    password: 'Password',
    enterPassword: 'Enter password',
    userType: 'User Type',
    sendResetEmail: 'Send Reset Email',
    resetEmailSent: 'Password reset email sent.',
    resetEmailError: 'Failed to send reset email.',
    roleChangedSuccess: 'Role changed successfully.',
    roleChangedError: 'Failed to change role.',
    managePermissions: 'Manage Permissions',
    permissionsSaved: 'Permissions saved.',
    permissionsError: 'Failed to save permissions.',
    filterByRole: 'Filter by Role',
    allRoles: 'All Roles',
    permissionsTitle: 'Module Permissions',
    permissionsDesc: 'Select which modules this user can access.',
  },
  ar: {
    allUsers: 'كل المستخدمين',
    addNewUser: 'إضافة مستخدم جديد',
    filter: 'تصفية',
    searchByUsername: 'البحث باسم المستخدم',
    searchByPhoneNumber: 'البحث برقم الهاتف',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    slNo: 'رقم تسلسلي',
    userName: 'اسم المستخدم',
    phoneNumber: 'رقم الهاتف',
    emailAddress: 'عنوان البريد الإلكتروني',
    action: 'إجراء',
    edit: 'تعديل',
    delete: 'حذف',
    rowsPerPage: 'صفوف لكل صفحة',
    addUserTitle: 'إضافة مستخدم جديد',
    editUserTitle: 'تعديل المستخدم',
    enterUsername: 'أدخل اسم المستخدم',
    enterPhoneNumber: 'أدخل رقم الهاتف',
    enterEmail: 'أدخل عنوان البريد الإلكتروني',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    deleteUserTitle: 'حذف المستخدم',
    deleteUserMessage: 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
    page: 'صفحة',
    of: 'من',
    role: 'الدور',
    changeRole: 'تغيير الدور',
    admin: 'مسؤول',
    manager: 'مدير',
    vendor: 'بائع',
    customer: 'مستخدم',
    password: 'كلمة المرور',
    enterPassword: 'أدخل كلمة المرور',
    userType: 'نوع المستخدم',
    sendResetEmail: 'إرسال بريد إعادة التعيين',
    resetEmailSent: 'تم إرسال بريد إعادة تعيين كلمة المرور.',
    resetEmailError: 'فشل في إرسال بريد إعادة التعيين.',
    roleChangedSuccess: 'تم تغيير الدور بنجاح.',
    roleChangedError: 'فشل في تغيير الدور.',
    managePermissions: 'إدارة الصلاحيات',
    permissionsSaved: 'تم حفظ الصلاحيات.',
    permissionsError: 'فشل في حفظ الصلاحيات.',
    filterByRole: 'تصفية حسب الدور',
    allRoles: 'جميع الأدوار',
    permissionsTitle: 'صلاحيات الوحدات',
    permissionsDesc: 'حدد الوحدات التي يمكن لهذا المستخدم الوصول إليها.',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  type: z.enum(['admin', 'manager', 'vendor', 'customer']).default('customer'),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof FormSchema>;

export default function UsersListPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [usersRaw, setUsers] = useState<User[]>([]);
  const users = useTranslatedData(usersRaw);
  const [filteredUsersRaw, setFilteredUsers] = useState<User[]>([]);
  const filteredUsers = useTranslatedData(filteredUsersRaw);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [usernameSearch, setUsernameSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('non-vendor');
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const data = await getUsers();
        setUsers(data);
    } catch (error) {
        console.error("Failed to fetch users:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const applyFilters = () => {
    let result = users;
    if (typeFilter === 'non-vendor') {
      result = result.filter(u => u.type !== 'vendor');
    } else if (typeFilter && typeFilter !== 'all') {
      result = result.filter(u => u.type === typeFilter);
    }
    if (usernameSearch) {
      result = result.filter((u) =>
        u.name.toLowerCase().includes(usernameSearch.toLowerCase())
      );
    }
    if (phoneSearch) {
      result = result.filter((u) => u.phone?.includes(phoneSearch));
    }
    setFilteredUsers(result);
  };

  useEffect(() => {
    applyFilters();
  }, [usernameSearch, phoneSearch, users, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const openAddDialog = () => {
    setEditingUser(null);
    reset({ name: '', phone: '', email: '', type: 'customer', password: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    reset({ name: user.name, phone: user.phone, email: user.email, type: user.type || 'customer', password: '' });
    setIsDialogOpen(true);
  };
    

  const onSubmit = async (data: UserFormValues) => {
    if (!editingUser && !data.password) {
      toast({ title: 'Password is required for new users.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id!, { name: data.name, phone: data.phone, email: data.email, type: data.type });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password!);
        await createUser({
          userid: userCredential.user.uid,
          name: data.name,
          phone: data.phone,
          email: data.email,
          type: data.type,
        });
      }
      fetchUsers();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({ title: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: t.resetEmailSent });
    } catch {
      toast({ title: t.resetEmailError, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingUserId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingUserId) {
      try {
        await deleteUser(deletingUserId);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      } finally {
        setIsAlertOpen(false);
        setDeletingUserId(null);
      }
    }
  };
  
  const handleReset = () => {
    setUsernameSearch('');
    setPhoneSearch('');
  }

  const roleLabels: Record<string, string> = {
    admin: t.admin,
    manager: t.manager,
    vendor: t.vendor,
    customer: t.customer,
  };

  const openRoleDialog = (user: User) => {
    setRoleChangeUser(user);
    setSelectedRole(user.type || 'customer');
    setIsRoleDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;
    try {
      await updateUser(roleChangeUser.id!, { type: selectedRole as User['type'] });
      toast({ title: t.roleChangedSuccess });
      fetchUsers();
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Failed to change role:', error);
      toast({ title: t.roleChangedError, variant: 'destructive' });
    }
  };

  const openPermissionsDialog = (user: User) => {
    setPermissionsUser(user);
    setEditingPermissions(new Set(user.permissions || []));
    setIsPermissionsDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setEditingPermissions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handlePermissionsSave = async () => {
    if (!permissionsUser) return;
    try {
      await updateUser(permissionsUser.id!, { permissions: Array.from(editingPermissions) });
      toast({ title: t.permissionsSaved });
      fetchUsers();
      setIsPermissionsDialogOpen(false);
    } catch {
      toast({ title: t.permissionsError, variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allUsers}</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addNewUser}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 border rounded-lg">
        <span className='text-sm font-medium'>{t.filter}</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t.filterByRole} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="non-vendor">{t.admin} / {t.vendor} / {t.customer}</SelectItem>
            <SelectItem value="all">{t.allRoles}</SelectItem>
            <SelectItem value="admin">{t.admin}</SelectItem>
            <SelectItem value="vendor">{t.vendor}</SelectItem>
            <SelectItem value="customer">{t.customer}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t.searchByUsername}
          className="w-full sm:w-auto"
          value={usernameSearch}
          onChange={(e) => setUsernameSearch(e.target.value)}
        />
        <Input
          placeholder={t.searchByPhoneNumber}
          className="w-full sm:w-auto"
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
        />
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
                <TableHead>{t.slNo}</TableHead>
                <TableHead>{t.userName}</TableHead>
                <TableHead>{t.phoneNumber}</TableHead>
                <TableHead>{t.emailAddress}</TableHead>
                <TableHead>{t.role}</TableHead>
                <TableHead>{t.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <a href={`tel:${user.phone}`} className="hover:underline">
                        {user.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <a href={`mailto:${user.email}`} className="hover:underline">
                        {user.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium capitalize">{roleLabels[user.type || 'customer'] || user.type}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openRoleDialog(user)} title={t.changeRole}>
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                        </Button>
                        {(user.type === 'admin' || user.type === 'manager') && (
                          <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(user)} title={t.managePermissions}>
                            <KeyRound className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found.
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t.editUserTitle : t.addUserTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium mb-1">{t.userName} *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} placeholder={t.enterUsername} />}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.phoneNumber} *</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} placeholder={t.enterPhoneNumber} />}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.emailAddress} *</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} type="email" placeholder={t.enterEmail} />}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.userType}</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t.admin}</SelectItem>
                      <SelectItem value="vendor">{t.vendor}</SelectItem>
                      <SelectItem value="customer">{t.customer}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {!editingUser ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t.password} *</label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => <Input {...field} type="password" placeholder={t.enterPassword} autoComplete="new-password" />}
                />
              </div>
            ) : (
              <div className="md:col-span-2 flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">{t.password}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleSendResetEmail(editingUser.email)}>
                  {t.sendResetEmail}
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> : t.saveChanges}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteUserTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteUserMessage}
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
            <DialogTitle>{t.changeRole} - {roleChangeUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t.admin}</SelectItem>
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

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t.permissionsTitle} — {permissionsUser?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{t.permissionsDesc}</p>
          <div className="grid grid-cols-1 gap-3">
            {ALL_PERMISSIONS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 cursor-pointer" onClick={() => togglePermission(key)}>
                <Checkbox
                  checked={editingPermissions.has(key)}
                  onCheckedChange={() => togglePermission(key)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsPermissionsDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handlePermissionsSave}>{t.saveChanges}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
