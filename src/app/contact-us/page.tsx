'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, X, Phone, Mail, MapPin, Clock, MessageCircle, Facebook, Twitter, Instagram, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { getContactUs, updateContactUs } from '@/lib/contact-us';
import { uploadFileClient } from '@/lib/storage-client';
import RichTextEditor from '@/components/blog/rich-text-editor';
import Image from 'next/image';

const translations = {
  en: {
    title: 'Contact Us',
    heading: 'Heading',
    headingPlaceholder: 'Enter section heading',
    description: 'Description',
    image: 'Image (Optional)',
    contactInfo: 'Contact Information',
    phone: 'Phone Number',
    phone2: 'Phone Number 2',
    email: 'Email Address',
    address: 'Address',
    workingHours: 'Working Hours',
    socialMedia: 'Social Media',
    whatsapp: 'WhatsApp Number',
    facebook: 'Facebook URL',
    twitter: 'Twitter / X URL',
    instagram: 'Instagram URL',
    mapUrl: 'Google Maps URL',
    changeImage: 'Change Image',
    uploadImage: 'Upload Image',
    removeImage: 'Remove Image',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    uploading: 'Uploading...',
    successSave: 'Contact Us saved successfully.',
    errorSave: 'Failed to save. Please try again.',
    errorUpload: 'Failed to upload image. Please try again.',
    loading: 'Loading...',
  },
  ar: {
    title: 'اتصل بنا',
    heading: 'العنوان',
    headingPlaceholder: 'أدخل عنوان القسم',
    description: 'الوصف',
    image: 'الصورة (اختياري)',
    contactInfo: 'معلومات التواصل',
    phone: 'رقم الهاتف',
    phone2: 'رقم الهاتف 2',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    workingHours: 'ساعات العمل',
    socialMedia: 'وسائل التواصل الاجتماعي',
    whatsapp: 'رقم واتساب',
    facebook: 'رابط فيسبوك',
    twitter: 'رابط تويتر / X',
    instagram: 'رابط انستغرام',
    mapUrl: 'رابط خرائط جوجل',
    changeImage: 'تغيير الصورة',
    uploadImage: 'رفع صورة',
    removeImage: 'إزالة الصورة',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    uploading: 'جارٍ الرفع...',
    successSave: 'تم حفظ صفحة "اتصل بنا" بنجاح.',
    errorSave: 'فشل الحفظ. حاول مرة أخرى.',
    errorUpload: 'فشل رفع الصورة. حاول مرة أخرى.',
    loading: 'جارٍ التحميل...',
  },
};

export default function ContactUsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dir = direction;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getContactUs();
        setHeading(data.heading || 'Get in Touch with Us');
        setDescription(data.description || '<p>We would love to hear from you. Whether you have a question about our services, need assistance, or just want to say hello — our team is always here to help.</p>');
        setImageUrl(data.imageUrl || '');
        setPhone(data.phone || '+974 4444 5555');
        setPhone2(data.phone2 || '+974 3333 2222');
        setEmail(data.email || 'support@mandobak.com');
        setAddress(data.address || 'West Bay, Doha, Qatar');
        setWorkingHours(data.workingHours || 'Sun – Thu: 8:00 AM – 6:00 PM');
        setWhatsapp(data.whatsapp || '+974 5555 6666');
        setFacebook(data.facebook || 'https://facebook.com/mandobak');
        setTwitter(data.twitter || 'https://x.com/mandobak');
        setInstagram(data.instagram || 'https://instagram.com/mandobak');
        setMapUrl(data.mapUrl || 'https://maps.google.com/?q=West+Bay+Doha+Qatar');
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
      const url = await uploadFileClient(file, 'contact-us', 'cover');
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
      await updateContactUs({ heading, description, imageUrl, phone, phone2, email, address, workingHours, whatsapp, facebook, twitter, instagram, mapUrl });
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
                placeholder="Write contact us section content here..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.contactInfo}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="h-4 w-4" />{t.phone}</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+974 XXXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2" className="flex items-center gap-1"><Phone className="h-4 w-4" />{t.phone2}</Label>
                <Input id="phone2" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="+974 XXXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-4 w-4" />{t.email}</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workingHours" className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.workingHours}</Label>
                <Input id="workingHours" value={workingHours} onChange={e => setWorkingHours(e.target.value)} placeholder="Sun - Thu: 9:00 AM - 6:00 PM" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="flex items-center gap-1"><MapPin className="h-4 w-4" />{t.address}</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Doha, Qatar" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mapUrl" className="flex items-center gap-1"><Map className="h-4 w-4" />{t.mapUrl}</Label>
                <Input id="mapUrl" value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t.socialMedia}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{t.whatsapp}</Label>
                <Input id="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+974 XXXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-1"><Facebook className="h-4 w-4" />{t.facebook}</Label>
                <Input id="facebook" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-1"><Twitter className="h-4 w-4" />{t.twitter}</Label>
                <Input id="twitter" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-1"><Instagram className="h-4 w-4" />{t.instagram}</Label>
                <Input id="instagram" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
              </div>
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
                    alt="Contact Us"
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
