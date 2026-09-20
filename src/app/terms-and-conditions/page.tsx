
'use client';
import { useState, useEffect } from 'react';
import { getTermsAndConditions, updateTermsAndConditions } from '@/lib/terms-and-conditions';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/blog/rich-text-editor';

const translations = {
  en: {
    title: 'Terms & Conditions',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    successSave: 'Terms & Conditions saved successfully.',
    errorSave: 'Failed to save Terms & Conditions.',
    loading: 'Loading Terms & Conditions...',
  },
  ar: {
    title: 'الشروط والأحكام',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    successSave: 'تم حفظ الشروط والأحكام بنجاح.',
    errorSave: 'فشل حفظ الشروط والأحكام.',
    loading: 'جارٍ تحميل الشروط والأحكام...',
  },
};

export default function TermsAndConditionsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.documentElement.dir = direction;
    const fetchPolicy = async () => {
      setLoading(true);
      const data = await getTermsAndConditions();
      setContent(data.description);
      setLoading(false);
    };
    fetchPolicy();
  }, [direction]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateTermsAndConditions(content);
      toast({ title: t.successSave });
    } catch (error) {
      console.error(error);
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
        <div className="flex gap-2">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? t.saving : t.saveChanges}
          </Button>
        </div>
      </div>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Write your terms and conditions here..."
      />
    </div>
  );
}
