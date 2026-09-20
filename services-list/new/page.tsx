

'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createService,
  Service,
  updateService,
  getServiceById
} from '@/lib/services';
import { getCategories, Category } from '@/lib/categories';
import { getSubCategories, SubCategory } from '@/lib/sub-categories';
import { getDepartments, Department } from '@/lib/departments';
import { useLanguage } from '@/context/language-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { uploadFileClient as uploadFile, deleteFileClient as deleteFile } from '@/lib/storage-client';

import ServiceDetailPageBuilder from '@/app/apps/servicedetailbuilder/page';
import FormEditorPage, { FormEditorRef } from '@/app/apps/formbuilder/forms/[formId]/edit/page';
import { createServiceRequirementsForm, getFormsForService } from '@/lib/firebaseService/forms';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient();

const translations = {
  en: {
    addService: 'Add a Service',
    editService: 'Edit Service',
    step1: 'Step 1',
    step2: 'Step 2',
    step3: 'Step 3',
    serviceDetails: 'Service Details',
    servicePage: 'Service Page',
    requirements: 'Requirements',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    departments: 'Departments',
    categories: 'Categories',
    subCategories: 'Sub Categories',
    serviceName: 'Service Name',
    description: 'Description',
    price: 'Price',
    discount: 'Discount',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    selectDepartment: 'Select Department',
    selectCategory: 'Select Category',
    selectSubCategory: 'Select Sub Category',
    enterName: 'Enter name',
    enterDescription: 'Enter description',
    enterPrice: 'Enter price',
    enterDiscount: 'Enter discount (optional)',
    saving: 'Saving...',
    creatingForm: 'Creating form...',
    serviceImage: 'Service Image',
    chooseFile: 'Choose File',
    imageSizeError: 'Image size should be less than 1MB.',
    basePrice: 'Base Price',
  },
  ar: {
    addService: 'إضافة خدمة',
    editService: 'تحرير الخدمة',
    step1: 'الخطوة 1',
    step2: 'الخطوة 2',
    step3: 'الخطوة 3',
    serviceDetails: 'تفاصيل الخدمة',
    servicePage: 'صفحة الخدمة',
    requirements: 'المتطلبات',
    next: 'التالي',
    previous: 'السابق',
    finish: 'إنهاء',
    departments: 'الأقسام',
    categories: 'الفئات',
    subCategories: 'الفئات الفرعية',
    serviceName: 'اسم الخدمة',
    description: 'الوصف',
    price: 'السعر',
    discount: 'الخصم',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    selectDepartment: 'اختر القسم',
    selectCategory: 'اختر الفئة',
    selectSubCategory: 'اختر الفئة الفرعية',
    enterName: 'أدخل الاسم',
    enterDescription: 'أدخل الوصف',
    enterPrice: 'أدخل السعر',
    enterDiscount: 'أدخل الخصم (اختياري)',
    saving: 'جارٍ الحفظ...',
    creatingForm: 'جاري إنشاء النموذج ...',
    serviceImage: 'صورة الخدمة',
    chooseFile: 'اختر ملف',
    imageSizeError: 'يجب أن يكون حجم الصورة أقل من 1 ميغابايت.',
    basePrice: 'السعر الأساسي',
  },
};

const FormSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub Category is required'),
  formId: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  basePrice: z.preprocess(
    (a) => parseFloat(z.string().parse(String(a))),
    z.number().positive('Price must be a positive number')
  ),
});

type ServiceFormValues = z.infer<typeof FormSchema>;

const Step1ServiceDetails = ({ control, errors, activeDepartments, activeCategories, subCategories, selectedCategoryId, getValues, setValue, watch, t, serviceId }: any) => {
    const currentCategoryId = selectedCategoryId || getValues('categoryId');
    const filteredSubCategoriesForSelect = currentCategoryId ? subCategories.filter((sc: SubCategory) => sc.categoryId === currentCategoryId) : [];
    
    const imageUrl = watch('imageUrl');
    const [isImageUploading, setIsImageUploading] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: "Image size should be less than 5MB.",
                });
                return;
            }

            if (serviceId) {
                setIsImageUploading(true);
                try {
                    const oldUrl = getValues('imageUrl');
                    const downloadUrl = await uploadFile(file, `services/${serviceId}`, 'main_image');
                    
                    setValue('imageUrl', downloadUrl, { shouldValidate: true });
                    
                    // Also immediate DB update for main service
                    await updateService(serviceId, { imageUrl: downloadUrl });

                    if (oldUrl && oldUrl.includes('firebasestorage') && oldUrl !== downloadUrl) {
                        await deleteFile(oldUrl);
                    }
                    toast({ title: 'Success', description: 'Image uploaded and updated.' });
                } catch (error) {
                    console.error("Upload error:", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
                } finally {
                    setIsImageUploading(false);
                }
            } else {
                // New service, store File object in form and show preview
                setValue('imageFile', file); // We'll add this to form values
                const reader = new FileReader();
                reader.onloadend = () => {
                   // We still set imageUrl for preview purposes
                   setValue('imageUrl', reader.result as string, { shouldValidate: true });
                };
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div className="space-y-4 p-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="departmentId" className="block text-sm font-medium mb-1">
                        {t.departments} *
                    </label>
                    <Controller
                        name="departmentId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.selectDepartment} />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeDepartments.map((dept: Department) => <SelectItem key={dept.id} value={dept.id!}>{dept.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.departmentId && (
                        <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                        {t.categories} *
                    </label>
                    <Controller
                        name="categoryId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.selectCategory} />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeCategories.map((cat: Category) => <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.categoryId && (
                        <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                    )}
                </div>
                 <div>
                    <label htmlFor="subCategoryId" className="block text-sm font-medium mb-1">
                        {t.subCategories} *
                    </label>
                    <Controller
                        name="subCategoryId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={!currentCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.selectSubCategory} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubCategoriesForSelect.map((subCat: SubCategory) => <SelectItem key={subCat.id} value={subCat.id!}>{subCat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.subCategoryId && (
                        <p className="text-red-500 text-sm mt-1">{errors.subCategoryId.message}</p>
                    )}
                </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                {t.serviceName} *
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t.enterName} />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
             <div>
                <label htmlFor="basePrice" className="block text-sm font-medium mb-1">
                    {t.basePrice} *
                </label>
                <Controller
                    name="basePrice"
                    control={control}
                    render={({ field }) => (
                        <Input 
                            {...field} 
                            type="number"
                            placeholder={t.enterPrice}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                    )}
                />
                {errors.basePrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.basePrice.message}</p>
                )}
            </div>
             <div>
                <label htmlFor="serviceImage" className="block text-sm font-medium mb-1">
                    {t.serviceImage}
                </label>
                <div className="flex items-center gap-4">
                    {imageUrl ? (
                        <Image src={imageUrl} alt="Service Image" width={64} height={64} className="rounded-md object-cover" />
                    ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            {isImageUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : <UploadCloud className="h-8 w-8 text-muted-foreground"/>}
                        </div>
                    )}
                    <Input id="image-upload" type="file" onChange={handleImageChange} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()} disabled={isImageUploading}>
                        {isImageUploading ? 'Uploading...' : t.chooseFile}
                    </Button>
                    {imageUrl && !isImageUploading && (
                        <Button variant="ghost" size="icon" onClick={() => {
                            setValue('imageUrl', null);
                            setValue('imageFile', null);
                        }}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

function NewServiceWizardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceDetailPageBuilderRef = useRef<{ getDetails: () => any, saveDetails: () => Promise<void> }>(null);
    const formEditorRef = useRef<FormEditorRef>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [serviceId, setServiceId] = useState<string | null>(null);
    const [currentFormId, setCurrentFormId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingForm, setIsCreatingForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const { language, direction } = useLanguage();
    const t = translations[language];

    const [departments, setDepartments] = useState<Department[]>([]);
    const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategories, setActiveCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

    const {
        handleSubmit,
        control,
        watch,
        setValue,
        getValues,
        reset,
        formState: { errors, isValid },
    } = useForm<ServiceFormValues>({
        resolver: zodResolver(FormSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            departmentId: '',
            categoryId: '',
            subCategoryId: '',
            imageUrl: null,
            basePrice: 0,
        },
    });

    const selectedCategoryId = watch('categoryId');

     useEffect(() => {
        const serviceIdParam = searchParams.get('serviceId');
        const formIdParam = searchParams.get('formId');
        const editing = !!serviceIdParam;
        setIsEditMode(editing);
        
        setIsLoadingData(true);

        const fetchData = async () => {
            try {
                const [departmentsData, categoriesData, subCategoriesData] = await Promise.all([
                    getDepartments(),
                    getCategories(),
                    getSubCategories(),
                ]);
                setDepartments(departmentsData);
                setActiveDepartments(departmentsData.filter(d => d.status === 'Active'));
                setCategories(categoriesData);
                setActiveCategories(categoriesData.filter(cat => cat.status === 'Active'));
                setSubCategories(subCategoriesData);

                if (editing && serviceIdParam) {
                    const serviceData = await getServiceById(serviceIdParam);
                    if (serviceData) {
                        setServiceId(serviceData.id!);
                        setCurrentFormId(formIdParam || serviceData.formId || null);
                        reset({
                          name: serviceData.name,
                          departmentId: serviceData.departmentId,
                          categoryId: serviceData.categoryId,
                          subCategoryId: serviceData.subCategoryId,
                          imageUrl: serviceData.imageUrl || null,
                          basePrice: serviceData.basePrice || 0,
                        });
                    }
                } else {
                    setServiceId(null);
                    setCurrentFormId(null);
                    reset({ name: '', departmentId: '', categoryId: '', subCategoryId: '', imageUrl: null, basePrice: 0 });
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [searchParams, reset]);


    useEffect(() => {
        document.documentElement.dir = direction;
    }, [direction]);

    const onStep1Submit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const { imageFile, ...restData } = data;
            if (isEditMode && serviceId) {
                // Image already handled by handleImageChange if it's existing service
                await updateService(serviceId, { ...restData, status: 'Inactive' });
                setCurrentStep(2);
            } else {
                 const serviceData = {
                    ...restData,
                    description: '',
                    status: 'Inactive'
                };
                const result = await createService(serviceData, imageFile);
                setServiceId(result.id!);
                setCurrentStep(2);
            }
        } catch (error) {
            console.error('Failed to save service details:', error);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to save service: ${(error as any).message || 'Unknown error'}` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleNextToStep3 = async () => {
        if (!serviceId) return;
        setIsSubmitting(true);
        try {
            if (serviceDetailPageBuilderRef.current) {
                await serviceDetailPageBuilderRef.current.saveDetails();
            }
    
            let formIdToUse = currentFormId;
    
            if (!formIdToUse) {
                setIsCreatingForm(true);
                try {
                    const serviceName = getValues("name");
                    const existingForms = await getFormsForService(serviceId);
                    const newFormId = await createServiceRequirementsForm(serviceId, {
                        name: `${serviceName} - Requirements`,
                        description: `Form to gather requirements for the ${serviceName} service.`,
                        elements: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        order: existingForms.length,
                    });
                    await updateService(serviceId, { formId: newFormId });
                    setCurrentFormId(newFormId);
                    formIdToUse = newFormId;
                } catch (error) {
                    console.error("Failed to create form for service:", error);
                    setIsCreatingForm(false);
                    return;
                } finally {
                    setIsCreatingForm(false);
                }
            }
            setCurrentStep(3);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            if (formEditorRef.current) {
                await formEditorRef.current.saveForm();
            }
            if (serviceId) {
                await updateService(serviceId, { status: 'Active' });
            }
            router.push('/services-list');
        } catch (error) {
            console.error("Failed to save form or update status:", error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const prevStep = () => {
        const newStep = Math.max(currentStep - 1, 1);
        setCurrentStep(newStep);
    };

    const steps = [
        { num: 1, title: t.serviceDetails },
        { num: 2, title: t.servicePage },
        { num: 3, title: t.requirements }
    ];
    
    const renderStepContent = () => {
        if (isLoadingData) {
            return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
        }
        switch (currentStep) {
            case 1:
                return (
                    <form onSubmit={handleSubmit(onStep1Submit)}>
                        <Step1ServiceDetails
                            control={control}
                            errors={errors}
                            activeDepartments={activeDepartments}
                            activeCategories={activeCategories}
                            subCategories={subCategories}
                            selectedCategoryId={selectedCategoryId}
                            getValues={getValues}
                            setValue={setValue}
                            watch={watch}
                            t={t}
                            serviceId={serviceId}
                        />
                    </form>
                );
            case 2:
                 if (!serviceId) {
                    return <div className="h-96 flex items-center justify-center"><p>Service ID is missing. Please go back to Step 1.</p></div>;
                }
                return <ServiceDetailPageBuilder serviceId={serviceId} ref={serviceDetailPageBuilderRef} />;
            case 3:
                if (!serviceId || !currentFormId) {
                    return <div className="h-96 flex items-center justify-center"><p>Form or Service ID is missing. Please go back.</p></div>;
                }
                return (
                    <div className="relative">
                        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                            <FormEditorPage 
                                params={{ formId: currentFormId }} 
                                hideSaveButton={true} 
                                serviceId={serviceId} 
                                onFormSwitch={setCurrentFormId}
                                ref={formEditorRef} 
                            />
                        </Suspense>
                    </div>
                );
            default:
                return null;
        }
    }


    return (
      <div className="flex-1 p-8 bg-background text-foreground" dir={direction}>
            <>
                <h1 className="text-2xl font-bold mb-6">{isEditMode ? t.editService : t.addService}</h1>
                <div className="w-full max-w-6xl mx-auto">
                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-8">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.num}>
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => {
                                if (isEditMode || (step.num < currentStep && serviceId)) {
                                    setCurrentStep(step.num);
                                }
                            }}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {step.num}
                                </div>
                                <p className="mt-2 text-sm font-medium">{step.title}</p>
                            </div>
                            {index < steps.length - 1 && <div className="flex-1 h-px bg-border mx-4"></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Content */}
                    <div className={cn("bg-card rounded-lg border", currentStep !== 3 && 'mb-8')}>
                        {renderStepContent()}
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                    {currentStep > 1 ? (
                        <Button variant="outline" onClick={prevStep}>
                        {t.previous}
                        </Button>
                    ) : <div></div>}
                    
                    {currentStep === 1 && (
                        <Button onClick={handleSubmit(onStep1Submit)} disabled={!isValid || isSubmitting}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> : t.next}
                        </Button>
                    )}

                    {currentStep === 2 && (
                         <Button onClick={handleNextToStep3} disabled={isSubmitting || isCreatingForm}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> : (isCreatingForm ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.creatingForm}</> : t.next)}
                        </Button>
                    )}
                    
                     {currentStep === 3 && (
                        <Button onClick={handleFinish} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> : t.finish}
                        </Button>
                     )}
                    </div>
                </div>
            </>
        </div>
    );
}

export default function NewServiceWizard() {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <NewServiceWizardPage />
        </Suspense>
      </QueryClientProvider>
    )
}
