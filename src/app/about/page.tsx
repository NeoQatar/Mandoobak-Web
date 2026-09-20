'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { getAbout, updateAbout } from '@/lib/about';
import { uploadFileClient } from '@/lib/storage-client';
import RichTextEditor from '@/components/blog/rich-text-editor';
import Image from 'next/image';

const translations = {
  en: {
    title: 'About',
    heading: 'Heading',
    headingPlaceholder: 'Enter section heading',
    description: 'Description',
    image: 'Image (Optional)',
    changeImage: 'Change Image',
    uploadImage: 'Upload Image',
    removeImage: 'Remove Image',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    uploading: 'Uploading...',
    successSave: 'About section saved successfully.',
    errorSave: 'Failed to save. Please try again.',
    errorUpload: 'Failed to upload image. Please try again.',
    loading: 'Loading...',
  },
  ar: {
    title: 'حول',
    heading: 'العنوان',
    headingPlaceholder: 'أدخل عنوان القسم',
    description: 'الوصف',
    image: 'الصورة (اختياري)',
    changeImage: 'تغيير الصورة',
    uploadImage: 'رفع صورة',
    removeImage: 'إزالة الصورة',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    uploading: 'جارٍ الرفع...',
    successSave: 'تم حفظ قسم "حول" بنجاح.',
    errorSave: 'فشل الحفظ. حاول مرة أخرى.',
    errorUpload: 'فشل رفع الصورة. حاول مرة أخرى.',
    loading: 'جارٍ التحميل...',
  },
};

export default function AboutPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dir = direction;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAbout();
        setHeading(data.heading || 'About Mandobak');
        setDescription(data.description || '<p>Mandobak is a leading platform that connects customers with trusted service providers across Qatar. We offer a wide range of official and professional services designed to make your life easier — all in one place.</p><p>Our mission is to simplify access to essential services by bridging the gap between customers and verified vendors through a seamless digital experience.</p>');
        setImageUrl(data.imageUrl || '');
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [direction]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileClient(file, 'about', 'cover');
      setImageUrl(url);
    } catch {
      toast({ title: t.errorUpload, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAbout({ heading, description, imageUrl });
      toast({ title: t.successSave });
    } catch {
      toast({ title: t.errorSave, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm font-medium animate-pulse">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? t.saving : t.saveChanges}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t.heading}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="heading">{t.heading}</Label>
                <Input
                  id="heading"
                  value={heading}
                  onChange={e => setHeading(e.target.value)}
                  placeholder={t.headingPlaceholder}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.description}</CardTitle></CardHeader>
            <CardContent>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write about section content here..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>{t.image}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <Image
                    src={imageUrl}
                    alt="About"
                    width={400}
                    height={240}
                    className="w-full object-cover h-48"
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                    title={t.removeImage}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No image uploaded
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.uploading}</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" />{imageUrl ? t.changeImage : t.uploadImage}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
