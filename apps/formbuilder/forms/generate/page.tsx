
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { addForm } from '@/lib/firebaseService/forms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FormElement, FormElementOption, FormElementType } from '@/types/forms';
import { v4 as uuidv4 } from 'uuid';


const mapGeneratedToFormElements = (generated: any): FormElement[] => {
  return generated.elements.map((el: any) => {
    const newElement: FormElement = {
      id: uuidv4(),
      type: el.type as FormElementType,
      label: el.label,
      required: el.required,
      helpText: el.helpText,
      placeholder: el.placeholder,
    };
    if (el.options) {
      newElement.options = el.options.map((opt: any) => ({
        id: uuidv4(),
        value: opt.value,
        icon: 'Smile', // default icon
        description: 'Description'
      }));
    }
     if (el.type === 'stepper' && el.options) {
        newElement.options = el.options.map((opt: any) => ({
            ...opt,
            id: uuidv4(),
            min: 0,
            max: 10
        }));
        newElement.totalMin = 1;
        newElement.totalMax = 10;
     }

    return newElement;
  });
};

export default function GenerateFormPage() {
  const router = useRouter();
  const [formPurpose, setFormPurpose] = useState('');

  const createFormMutation = useMutation({
    mutationFn: async (purpose: string) => {
      // This page is now disconnected from a service, so it can't create a form
      // in the new data model. We'll disable this functionality for now.
      throw new Error("Standalone form generation is disabled. Please create forms through the service creation wizard.");
    },
    onSuccess: (formId) => {
      toast({
        title: 'Form Generated!',
        description: 'Your new form has been created with AI.',
      });
      router.push(`/apps/formbuilder/forms/${formId}/edit`);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'There was an error generating the form.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPurpose.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please describe the purpose of your form.',
      });
      return;
    }
    createFormMutation.mutate(formPurpose);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="max-w-2xl w-full bg-background p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2">Generate Form with AI</h1>
        <p className="text-muted-foreground mb-6">
          This feature is currently disabled for standalone forms. Forms are now created as part of the service creation process.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="form-purpose" className="text-lg font-medium">
              What is this form for?
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              For example: "A customer feedback survey for a new coffee shop" or "A registration form for a marathon".
            </p>
            <Textarea
              id="form-purpose"
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              placeholder="e.g., A contact form for my portfolio website"
              className="min-h-[120px] text-base"
              disabled
            />
          </div>
          <Button type="submit" className="w-full text-lg py-6" disabled={true || createFormMutation.isPending}>
            {createFormMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Form (Disabled)'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
