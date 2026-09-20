
'use client';
import { useState, useEffect } from 'react';
import {
  getFaqs,
  updateFaqs,
  FAQ,
} from '@/lib/faqs';
import { useLanguage } from '@/context/language-context';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    title: 'Manage FAQs',
    addFaq: 'Add FAQ',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    question: 'Question',
    answer: 'Answer',
    newQuestion: 'New Question',
    newAnswer: 'New Answer',
    successSave: 'FAQs saved successfully.',
    errorSave: 'Failed to save FAQs.',
    successDelete: 'FAQ deleted successfully.',
    errorDelete: 'Failed to delete FAQ.',
    loading: 'Loading FAQs...',
  },
  ar: {
    title: 'إدارة الأسئلة الشائعة',
    addFaq: 'إضافة سؤال شائع',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    question: 'السؤال',
    answer: 'الجواب',
    newQuestion: 'سؤال جديد',
    newAnswer: 'جواب جديد',
    successSave: 'تم حفظ الأسئلة الشائعة بنجاح.',
    errorSave: 'فشل حفظ الأسئلة الشائعة.',
    successDelete: 'تم حذف السؤال الشائع بنجاح.',
    errorDelete: 'فشل حذف السؤال الشائع.',
    loading: 'جارٍ تحميل الأسئلة الشائعة...',
  },
};

export default function FaqsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

  const [faqsRaw, setFaqs] = useState<FAQ[]>([]);
  const faqs = useTranslatedData(faqsRaw);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.documentElement.dir = direction;
    const fetchFaqs = async () => {
      setLoading(true);
      const data = await getFaqs();
      setFaqs(data);
      setLoading(false);
    };
    fetchFaqs();
  }, [direction]);

  const handleAddFaq = () => {
    setFaqs([
      ...faqs,
      {
        id: Date.now(),
        question: t.newQuestion,
        answer: t.newAnswer,
      },
    ]);
  };

  const handleUpdateFaq = (id: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = faqs.map((faq) =>
      faq.id === id ? { ...faq, [field]: value } : faq
    );
    setFaqs(newFaqs);
  };

  const handleMoveFaq = (index: number, moveDirection: 'up' | 'down') => {
    const newFaqs = [...faqs];
    const newIndex = moveDirection === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFaqs.length) {
      const [movedFaq] = newFaqs.splice(index, 1);
      newFaqs.splice(newIndex, 0, movedFaq);
      setFaqs(newFaqs);
    }
  };

  const handleRemoveFaq = (id: number) => {
    const newFaqs = faqs.filter((faq) => faq.id !== id);
    setFaqs(newFaqs);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateFaqs(faqs);
      toast({ title: t.successSave });
       const refreshedFaqs = await getFaqs();
      setFaqs(refreshedFaqs);
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
            <Button onClick={handleAddFaq}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t.addFaq}
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? t.saving : t.saveChanges}
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="p-4 border rounded-md space-y-2 relative group"
              >
                <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => handleMoveFaq(index, 'up')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === faqs.length - 1}
                    onClick={() => handleMoveFaq(index, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleRemoveFaq(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-q-${faq.id}`}>{t.question}</Label>
                  <Input
                    id={`faq-q-${faq.id}`}
                    value={faq.question}
                    onChange={(e) =>
                      handleUpdateFaq(faq.id, 'question', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-a-${faq.id}`}>{t.answer}</Label>
                  <Textarea
                    id={`faq-a-${faq.id}`}
                    value={faq.answer}
                    onChange={(e) =>
                      handleUpdateFaq(faq.id, 'answer', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
