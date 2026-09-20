'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, FileText, ExternalLink, Camera, Home, ChevronRight, Lock } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { updateUser } from '@/lib/users';
import { logActivity } from '@/lib/activity-logs';
import { uploadFileClient } from '@/lib/storage-client';
import { useLanguage } from '@/context/language-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    myAccount: 'My Account',
    dashboard: 'Dashboard',
    profileInfo: 'Profile Information',
    name: 'Name',
    email: 'Email',
    phone: 'Phone Number',
    city: 'City',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    profileUpdated: 'Profile updated successfully!',
    documents: 'Documents',
    crDoc: 'CR - Commercial Registration',
    cpDoc: 'CP - Commercial Permit / License',
    eidDoc: 'EID - Electronic ID',
    mouDoc: 'MOU / Agreement',
    upload: 'Upload',
    uploading: 'Uploading...',
    view: 'View',
    noFile: 'No file uploaded',
    profilePhoto: 'Profile Photo',
    changePhoto: 'Change Photo',
    errorUpload: 'Failed to upload. Please try again.',
    errorSave: 'Failed to save changes. Please try again.',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    updatingPassword: 'Updating...',
    passwordUpdated: 'Password updated successfully!',
    passwordMismatch: 'New passwords do not match.',
    wrongPassword: 'Current password is incorrect.',
    passwordTooShort: 'Password must be at least 6 characters.',
    errorPassword: 'Failed to update password. Please try again.',
  },
  ar: {
    myAccount: 'حسابي',
    dashboard: 'لوحة التحكم',
    profileInfo: 'معلومات الملف الشخصي',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    city: 'المدينة',
    saveChanges: 'حفظ التغييرات',
    saving: 'جار الحفظ...',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح!',
    documents: 'المستندات',
    crDoc: 'السجل التجاري',
    cpDoc: 'الرخصة التجارية',
    eidDoc: 'الهوية الإلكترونية',
    mouDoc: 'مذكرة تفاهم / اتفاقية',
    upload: 'رفع',
    uploading: 'جار الرفع...',
    view: 'عرض',
    noFile: 'لم يتم رفع ملف',
    profilePhoto: 'صورة الملف الشخصي',
    changePhoto: 'تغيير الصورة',
    errorUpload: 'فشل الرفع. حاول مرة أخرى.',
    errorSave: 'فشل الحفظ. حاول مرة أخرى.',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    updatePassword: 'تحديث كلمة المرور',
    updatingPassword: 'جار التحديث...',
    passwordUpdated: 'تم تحديث كلمة المرور بنجاح!',
    passwordMismatch: 'كلمات المرور الجديدة غير متطابقة.',
    wrongPassword: 'كلمة المرور الحالية غير صحيحة.',
    passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    errorPassword: 'فشل تحديث كلمة المرور. حاول مرة أخرى.',
  },
};

type DocField = 'crDocUrl' | 'cpDocUrl' | 'eidDocUrl' | 'mouDocUrl';

export default function MyAccountPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations[language];
  const router = useRouter();
  const { toast } = useToast();
  const isVendor = dbUser?.type === 'vendor';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [docUploading, setDocUploading] = useState<Partial<Record<DocField, boolean>>>({});
  const [docUrls, setDocUrls] = useState<Partial<Record<DocField, string>>>({});

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs: Record<DocField, React.RefObject<HTMLInputElement>> = {
    crDocUrl: useRef<HTMLInputElement>(null),
    cpDocUrl: useRef<HTMLInputElement>(null),
    eidDocUrl: useRef<HTMLInputElement>(null),
    mouDocUrl: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || '');
      setPhone(dbUser.phoneNumber || '');
      setCity(dbUser.city || '');
      setProfileImageUrl(dbUser.profileImageUrl || '');
      setDocUrls({
        crDocUrl: dbUser.crDocUrl || '',
        cpDocUrl: dbUser.cpDocUrl || '',
        eidDocUrl: dbUser.eidDocUrl || '',
        mouDocUrl: dbUser.mouDocUrl || '',
      });
    }
  }, [dbUser]);

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dbUser?.id) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadFileClient(file, 'users/profile', dbUser.id);
      setProfileImageUrl(url);
      await updateUser(dbUser.id, { profileImageUrl: url });
    } catch {
      toast({ title: t.errorUpload, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!dbUser?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateUser(dbUser.id, { name, phoneNumber: phone, city });
      await logActivity({
        action: 'Profile Updated',
        description: `Updated profile information`,
        performedBy: dbUser.userid || dbUser.id!,
        performedByName: dbUser.name,
        performedByRole: dbUser.type,
        category: 'profile',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast({ title: t.errorSave, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (field: DocField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dbUser?.id) return;
    setDocUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await uploadFileClient(file, `users/docs/${dbUser.id}`, field);
      setDocUrls(prev => ({ ...prev, [field]: url }));
      await updateUser(dbUser.id, { [field]: url });
    } catch {
      toast({ title: t.errorUpload, variant: 'destructive' });
    } finally {
      setDocUploading(prev => ({ ...prev, [field]: false }));
      if (docInputRefs[field].current) docInputRefs[field].current!.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({ title: t.passwordMismatch, variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: t.passwordTooShort, variant: 'destructive' });
      return;
    }
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setChangingPassword(true);
    setPasswordSuccess(false);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await logActivity({
        action: 'Password Changed',
        description: 'Changed own password',
        performedBy: dbUser?.userid || dbUser?.id || user.uid,
        performedByName: dbUser?.name || 'Unknown',
        performedByRole: dbUser?.type || 'unknown',
        category: 'auth',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e: any) {
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        toast({ title: t.wrongPassword, variant: 'destructive' });
      } else {
        toast({ title: t.errorPassword, variant: 'destructive' });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const documents: { field: DocField; label: string }[] = [
    { field: 'crDocUrl', label: t.crDoc },
    { field: 'cpDocUrl', label: t.cpDoc },
    { field: 'eidDocUrl', label: t.eidDoc },
    { field: 'mouDocUrl', label: t.mouDoc },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 bg-background text-foreground" dir={direction}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.myAccount}</h1>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <button onClick={() => router.push('/dashboard')} className="hover:underline flex items-center">
            <Home className="h-4 w-4 mr-1" />
            {t.dashboard}
          </button>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>{t.myAccount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>{t.profilePhoto}</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImageUrl} />
                  <AvatarFallback className="text-2xl">{name.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t.changePhoto}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t.profileInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    value={dbUser?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t.city}</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.saving}</>
                  ) : t.saveChanges}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-600">{t.profileUpdated}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />{t.changePassword}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}>
                  {changingPassword ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.updatingPassword}</>
                  ) : t.updatePassword}
                </Button>
                {passwordSuccess && (
                  <span className="text-sm text-green-600">{t.passwordUpdated}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {isVendor && (
            <Card>
              <CardHeader><CardTitle>{t.documents}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {documents.map(({ field, label }) => (
                  <div key={field} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {docUrls[field] ? (
                            <a
                              href={docUrls[field]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> {t.view}
                            </a>
                          ) : t.noFile}
                        </p>
                      </div>
                    </div>
                    <input
                      ref={docInputRefs[field]}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => handleDocUpload(field, e)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => docInputRefs[field].current?.click()}
                      disabled={docUploading[field]}
                    >
                      {docUploading[field] ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{t.uploading}</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-1" />{t.upload}</>
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
