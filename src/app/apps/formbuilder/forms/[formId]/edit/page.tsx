

'use client';

import {useState, useEffect, memo, Suspense, forwardRef, useImperativeHandle, useRef} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getForm,
  updateForm,
  getFormsForService,
  createNewFormForService,
  deleteForm
} from '@/lib/firebaseService/forms';
import { getServiceById, updateService } from '@/lib/services';
import {toast} from '@/hooks/use-toast';
import {AVAILABLE_FORM_ELEMENTS} from '@/lib/form-constants';
import type {Form, FormElement, FormElementOption, FormElementType} from '@/types/forms';
import type { Service } from '@/lib/services';
import {v4 as uuidv4} from 'uuid';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Switch}from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  Minus,
  PanelLeft,
  PanelRight,
  ChevronDown,
  Smartphone,
  ChevronLeft,
  X,
  ArrowUp,
  ArrowDown,
  List,
  Play,
  Upload,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {cn} from '@/lib/utils';
import { IconPicker } from '@/components/icon-picker';
import { DynamicIcon } from '@/components/dynamic-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getServiceDetails, ServiceDetails } from '@/lib/firebaseService/service-details';
import Image from 'next/image';

const StepperElementPreview = ({ element }: { element: FormElement }) => {
    const [stepperValues, setStepperValues] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        if (element.options) {
            element.options.forEach(opt => {
                initial[opt.id] = opt.min ?? 0;
            });
        }
        return initial;
    });

    const updateStepperValue = (id: string, delta: number) => {
        setStepperValues(prev => {
            const option = element.options?.find(o => o.id === id);
            const currentVal = prev[id] || 0;
            const newVal = currentVal + delta;
            const min = option?.min ?? 0;
            const max = option?.max ?? Infinity;

            if (newVal < min || newVal > max) {
                return prev;
            }

            return { ...prev, [id]: newVal };
        });
    };

    return (
        <ScrollArea className="h-full max-h-60">
            <div className="space-y-3 pr-4">
                {element.options?.map(opt => {
                    const value = stepperValues[opt.id] ?? 0;
                    const canDecrement = value > (opt.min ?? 0);
                    const canIncrement = value < (opt.max ?? Infinity);
                    return (
                        <div key={opt.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                            <div>
                                <p className="font-medium">{opt.value}</p>
                                {opt.price && opt.price * value > 0 && <p className="text-xs text-muted-foreground">+QAR {opt.price * value}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className='h-8 w-8 bg-zinc-100 text-primary border-primary/20' onClick={() => updateStepperValue(opt.id, -1)} disabled={!canDecrement}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-bold w-4 text-center">{value}</span>
                                <Button variant="default" size="icon" className='h-8 w-8' onClick={() => updateStepperValue(opt.id, 1)} disabled={!canIncrement}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    );
};

const renderFormElement = (
  element: FormElement,
  isSelected: boolean,
  onClick: (() => void) | null, // Allow null for preview
  inPreview: boolean = false,
  editorSelections: Record<string, any> = {},
  setEditorSelections: (id: string, value: any) => void = () => {}
) => {
  const commonClasses =
    'border-l-4 transition-all duration-200 w-full';
  const selectedClasses = 'border-primary bg-primary/5';
  const unselectedClasses = 'border-transparent hover:bg-muted/50';
  const cursorClass = onClick ? 'cursor-pointer' : '';
  
  const editorSelectedValue = editorSelections[element.id] ?? element.defaultValue;

  let totalPrice = 0;
  if (element.options) {
      if (['multiple-choice', 'dropdown', 'rich-radio', 'toggle'].includes(element.type)) {
          const selectedOption = element.options.find(opt => opt.value === editorSelectedValue);
          if (selectedOption?.price && selectedOption.price > 0) {
              totalPrice += selectedOption.price;
          }
      }
  }


  return (
    <div
      onClick={onClick || undefined}
      className={cn(
        commonClasses,
        isSelected ? selectedClasses : unselectedClasses,
        cursorClass
      )}
    >
        <div className="p-4">
            <Label className={cn("font-bold", inPreview && "text-base")}>
                {element.label || 'Untitled Question'}
                {element.required && <span className="text-destructive"> *</span>}
            </Label>
            <p className={cn("text-xs text-muted-foreground mt-1", inPreview && "text-sm")}>
                {element.helpText}
            </p>

            <div className="mt-4">
                {
                {
                    'short-answer': <Input type="text" placeholder={element.placeholder} />,
                    'long-answer': (
                    <Textarea placeholder={element.placeholder} />
                    ),
                    'multiple-choice': (
                      <RadioGroup value={editorSelectedValue} onValueChange={(value) => setEditorSelections(element.id, value)}>
                          <div className="space-y-2">
                              {element.options?.map(opt => (
                                  <div key={opt.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2" onClick={(e) => { e.stopPropagation(); setEditorSelections(element.id, opt.value)}}>
                                      <RadioGroupItem value={opt.value} id={opt.id} />
                                      <Label htmlFor={opt.id}>{opt.value}</Label>
                                    </div>
                                    {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                                  </div>
                              ))}
                          </div>
                      </RadioGroup>
                    ),
                    'checkboxes': (
                      <div className="space-y-2">
                        {element.options?.map(opt => (
                          <div key={opt.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox id={opt.id} />
                              <Label htmlFor={opt.id}>{opt.value}</Label>
                            </div>
                            {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                          </div>
                        ))}
                      </div>
                    ),
                    dropdown: (
                    <Select value={editorSelectedValue} onValueChange={(value) => setEditorSelections(element.id, value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={element.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                             {element.options?.map(opt => (
                                <SelectItem key={opt.id} value={opt.value || opt.id}>
                                    {opt.value}{opt.price && opt.price > 0 ? ` (+QAR ${opt.price})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    ),
                    stepper: (
                        <StepperElementPreview element={element} />
                    ),
                    toggle: (
                    <div className="flex flex-wrap gap-2">
                        {element.options?.map((opt, index) => (
                        <Button key={opt.id} variant={editorSelectedValue === opt.value ? 'default' : 'outline'} className="rounded-full" onClick={(e) => { e.stopPropagation(); setEditorSelections(element.id, opt.value)}}>
                           {opt.value}{opt.price && opt.price > 0 ? ` (+QAR ${opt.price})` : ''}
                        </Button>
                        ))}
                    </div>
                    ),
                    'rich-radio': (
                    <div className="space-y-2">
                        {element.options?.map((opt, index) => (
                        <div key={opt.id} className={cn("flex items-center justify-between p-3 border rounded-md cursor-pointer", editorSelectedValue === opt.value && 'border-primary bg-primary/5')} onClick={(e) => { e.stopPropagation(); setEditorSelections(element.id, opt.value)}}>
                            <div className='flex items-center gap-3'>
                            {opt.icon && <DynamicIcon iconName={opt.icon} className="h-5 w-5 text-muted-foreground"/>}
                            <div>
                                <p className="font-medium">{opt.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                            </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {opt.price && opt.price > 0 && <span className="text-sm font-bold text-primary">+QAR {opt.price}</span>}
                              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", editorSelectedValue === opt.value ? 'border-primary' : 'border-muted-foreground')}>
                                {editorSelectedValue === opt.value && <div className='w-2.5 h-2.5 rounded-full bg-primary'/>}
                              </div>
                            </div>
                        </div>
                        ))}
                    </div>
                    ),
                    accordion: (
                    <Accordion type="single" collapsible className="w-full">
                        {element.options?.map((opt) => (
                        <AccordionItem value={opt.id} key={opt.id}>
                            <AccordionTrigger>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                {opt.icon && <DynamicIcon iconName={opt.icon} className="h-5 w-5 text-muted-foreground"/>}
                                {opt.value}
                                {opt.fileUploadRequired && <Upload className="h-4 w-4 text-muted-foreground ml-2" />}
                                </div>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-sm text-muted-foreground pl-8">{opt.description}</p>
                                {opt.fileUploadRequired && (
                                    <div className="pl-8 pt-2">
                                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                    ),
                }[element.type]
                }
            </div>
             {totalPrice > 0 && (
                <div className="mt-4 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Total:</span>
                        <span>QAR {totalPrice}</span>
                    </div>
                </div>
            )}
      </div>
    </div>
  );
};

interface ServiceFlowPreviewProps {
    serviceId: string;
    initialStep?: number;
    watchedValuesFromBuilder?: Record<string, any>;
}

const ServiceFlowPreview = ({ serviceId, initialStep = 0, watchedValuesFromBuilder }: ServiceFlowPreviewProps) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [watchedValues, setWatchedValues] = useState<Record<string, any>>(watchedValuesFromBuilder || {});
    const [totalPrice, setTotalPrice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['serviceFlowPreview', serviceId],
        queryFn: async () => {
            const service = await getServiceById(serviceId);
            if (!service) throw new Error("Service not found");
            const details = await getServiceDetails(serviceId);
            const forms = await getFormsForService(serviceId);
            const sortedForms = forms.sort((a,b) => (a.order || 0) - (b.order || 0));
            return { service, details, forms: sortedForms };
        },
        enabled: !!serviceId,
    });

    useEffect(() => {
        if (data) {
            const basePrice = data.service?.basePrice || 0;
            let optionsPrice = 0;
            
            data.forms.forEach(form => {
                form.elements?.forEach(element => {
                    let value = watchedValues[element.id];
                    if (value === undefined && element.defaultValue) {
                       value = element.defaultValue;
                    }

                    if (value && element.options) {
                        if (['multiple-choice', 'dropdown', 'rich-radio', 'toggle'].includes(element.type)) {
                            const selectedOption = element.options.find(opt => opt.value === value);
                            if (selectedOption?.price && selectedOption.price > 0) {
                                optionsPrice += selectedOption.price;
                            }
                        } else if (element.type === 'checkboxes' && typeof value === 'object') {
                            for (const optionId in value) {
                                if (value[optionId]) {
                                    const selectedOption = element.options.find(opt => opt.id === optionId);
                                    if (selectedOption?.price && selectedOption.price > 0) {
                                        optionsPrice += selectedOption.price;
                                    }
                                }
                            }
                        } else if (element.type === 'stepper' && typeof value === 'object') {
                            for (const optionId in value) {
                                const optionValue = value[optionId];
                                if (optionValue > 0) {
                                    const selectedOption = element.options.find(opt => opt.id === optionId);
                                    if (selectedOption?.price && selectedOption.price > 0) {
                                        optionsPrice += selectedOption.price * optionValue;
                                    }
                                }
                            }
                        }
                    }
                })
            });

            setTotalPrice(basePrice + optionsPrice);
        }
    }, [watchedValues, data]);
    
    const setValue = (id: string, value: any) => {
        setWatchedValues(prev => ({ ...prev, [id]: value }));
    };

    const handleNext = () => {
        if (!data) return;
        if (currentStep < data.forms.length) { 
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-full w-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (isError || !data) return <div className="flex items-center justify-center h-full w-full"><p className="text-destructive">Failed to load preview.</p></div>;

    const { service, details, forms } = data;
    const currentForm = currentStep > 0 ? forms[currentStep - 1] : null;

    const renderContent = () => {
      // Step 0: Service Details Page
      if (currentStep === 0) {
        return (
          <>
            {/* Banner */}
            <div className="relative">
                <Image src={details?.bannerImage || 'https://picsum.photos/seed/1/600/400'} alt="Banner" width={375} height={250} className="w-full h-48 object-cover" />
            </div>

            <div className="p-4">
                {/* Title and Description */}
                <p className="text-xs text-gray-500">{details?.serviceCategory}</p>
                <h1 className="text-2xl font-bold mt-1">{details?.serviceTitle}</h1>
                {details?.showHighlight && <div className="mt-2 inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{details.highlightText}</div>}
                <p className="text-sm text-gray-600 mt-4">{details?.description}</p>
                
                {/* Highlight Card */}
                {details?.showHighlight && (
                    <div className="mt-6 flex items-center gap-3 p-3 border rounded-lg">
                        <DynamicIcon iconName={details.highlightIcon || 'Clock'} className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="font-semibold">{details.highlightTitle}</p>
                            <p className="text-xs text-gray-500">{details.highlightNote}</p>
                        </div>
                    </div>
                )}
                {/* Video */}
                {details?.videoUrl && (
                    <div className="mt-6 relative">
                        {isPlaying ? (
                            <video 
                                src={details.videoUrl} 
                                className="w-full h-44 rounded-lg bg-cover bg-center" 
                                controls 
                                autoPlay 
                                onEnded={() => setIsPlaying(false)}
                            />
                        ) : (
                            <div className="relative w-full h-44 rounded-lg cursor-pointer" onClick={() => details.videoUrl && setIsPlaying(true)}>
                                <Image src={details.videoThumbnailUrl || ''} alt="Video placeholder" layout="fill" className="w-full h-full rounded-lg object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                    <div className="bg-white/80 rounded-full p-3">
                                        <Play className="h-8 w-8 text-black fill-black" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* FAQs */}
                {details?.faqs && details.faqs.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold mb-2">FAQ</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {details.faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={faq.id}>
                            <AccordionTrigger className="text-sm text-left">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-600">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                  </div>
                )}
            </div>
          </>
        );
      }
      
      // Steps 1+: Requirement Forms
      if (currentForm) {
        return (
          <div className="p-4">
            {(currentForm.elements || []).map(element => (
              <div key={element.id} className="border-b pb-4 mb-4">
                 <Label className="text-lg font-semibold">
                    {element.label}
                    {element.required && element.type !== 'accordion' && <span className="text-destructive"> *</span>}
                  </Label>
                  {element.helpText && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {element.helpText}
                    </p>
                  )}
                  <div className="mt-3">
                  {{
                    'short-answer': <Input placeholder={element.placeholder} />,
                    'long-answer': <Textarea placeholder={element.placeholder} />,
                     'multiple-choice': (
                      <RadioGroup onValueChange={value => setValue(element.id, value)} value={watchedValues[element.id] ?? element.defaultValue}>
                        <div className="space-y-2">
                          {element.options?.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.value} id={`prev-${opt.id}`} />
                                <Label htmlFor={`prev-${opt.id}`}>{opt.value}</Label>
                              </div>
                              {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ),
                    'checkboxes': (
                        <div className="space-y-2">
                          {element.options?.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox id={`prev-${opt.id}`} onCheckedChange={(checked) => {
                                    const current = watchedValues[element.id] || {};
                                    setValue(element.id, {...current, [opt.id]: checked});
                                }} />
                                <Label htmlFor={`prev-${opt.id}`}>{opt.value}</Label>
                              </div>
                               {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                            </div>
                          ))}
                        </div>
                    ),
                     'dropdown': (
                        <Select onValueChange={value => setValue(element.id, value)} defaultValue={element.defaultValue} value={watchedValues[element.id]}>
                            <SelectTrigger><SelectValue placeholder={element.placeholder || 'Select an option'} /></SelectTrigger>
                            <SelectContent>
                            {element.options?.map(opt => (
                                <SelectItem key={opt.id} value={opt.value}>
                                    <div className="flex justify-between w-full">
                                        <span>{opt.value}</span>
                                        {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground ml-4">+QAR {opt.price}</span>}
                                    </div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    ),
                     'toggle': (
                        <div className="flex flex-wrap gap-2">
                            {element.options?.map(opt => (
                            <Button key={opt.id} type="button" variant={(watchedValues[element.id] ?? element.defaultValue) === opt.value ? 'default' : 'outline'} className="rounded-full" onClick={() => setValue(element.id, opt.value)}>
                                {opt.value}{opt.price && opt.price > 0 ? ` (+QAR ${opt.price})` : ''}
                            </Button>
                            ))}
                        </div>
                    ),
                    'rich-radio': (
                        <div className="space-y-2">
                        {element.options?.map(opt => (
                        <div key={opt.id} className={cn("flex items-center justify-between p-3 border rounded-md cursor-pointer", (watchedValues[element.id] ?? element.defaultValue) === opt.value && 'border-primary bg-primary/5')} onClick={() => setValue(element.id, opt.value)}>
                            <div className='flex items-center gap-3'>
                                {opt.icon && <DynamicIcon iconName={opt.icon} className="h-5 w-5 text-muted-foreground"/>}
                                <div>
                                    <p className="font-medium">{opt.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {opt.price && opt.price > 0 && <span className="text-sm font-bold text-primary">+QAR {opt.price}</span>}
                                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", (watchedValues[element.id] ?? element.defaultValue) === opt.value ? 'border-primary' : 'border-muted-foreground')}>
                                    {(watchedValues[element.id] ?? element.defaultValue) === opt.value && <div className='w-2.5 h-2.5 rounded-full bg-primary'/>}
                                </div>
                            </div>
                        </div>
                        ))}
                        </div>
                    ),
                    'accordion': (
                        <Accordion type="single" collapsible className="w-full">
                            {element.options?.map((opt) => (
                            <AccordionItem value={opt.id} key={opt.id}>
                                <AccordionTrigger>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        {opt.icon && <DynamicIcon iconName={opt.icon} className="h-5 w-5 text-muted-foreground"/>}
                                        {opt.value}
                                        {opt.fileUploadRequired && <Upload className="h-4 w-4 text-muted-foreground ml-2" />}
                                    </div>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground pl-8">{opt.description}</p>
                                    {opt.fileUploadRequired && (
                                        <div className="pl-8 pt-2">
                                            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    ),
                    'stepper': (() => {
                        const stepperValue = watchedValues[element.id] || {};
                        
                        const updateStepperValue = (optionId: string, delta: number) => {
                            const option = element.options?.find(o => o.id === optionId);
                            const currentVal = stepperValue[optionId] || 0;
                            const newVal = currentVal + delta;
                            const min = option?.min ?? 0;
                            const max = option?.max ?? Infinity;

                            if (newVal < min || newVal > max) return;

                            setValue(element.id, { ...stepperValue, [optionId]: newVal });
                        };

                        return (
                            <div className="space-y-3">
                                {element.options?.map(opt => {
                                    const value = stepperValue[opt.id] ?? 0;
                                    const canDecrement = value > (opt.min ?? 0);
                                    const canIncrement = value < (opt.max ?? Infinity);
                                    return (
                                        <div key={opt.id} className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium">{opt.value}</p>
                                                {opt.price && opt.price * value > 0 && <p className="text-xs text-muted-foreground">+QAR {opt.price * value}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button type="button" variant="outline" size="icon" className='h-8 w-8' onClick={() => updateStepperValue(opt.id, -1)} disabled={!canDecrement}>
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="text-lg font-bold w-4 text-center">{value}</span>
                                                <Button type="button" variant="default" size="icon" className='h-8 w-8' onClick={() => updateStepperValue(opt.id, 1)} disabled={!canIncrement}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })(),
                  }[element.type]}
                  </div>
              </div>
            ))}
          </div>
        );
      }

      return <div>End of flow.</div>;
    };
    
    const renderHeader = () => {
        let title = service.name;
        if(currentStep > 0 && currentForm) {
            title = currentForm.name;
        }

        return (
             <div className="absolute top-0 left-0 w-full h-10 bg-white z-10 flex items-center justify-between px-4 pt-2">
                {currentStep > 0 ? (
                    <Button variant="ghost" size="icon" onClick={handleBack}><ChevronLeft /></Button>
                ) : <div className="w-8"></div>}
                <h2 className="font-semibold text-sm truncate px-2">{title}</h2>
                <div className="w-8"></div>
            </div>
        )
    };

    const renderFooter = () => {
      const isLastForm = currentStep === forms.length;

      if (currentStep === 0) {
        return <Button className="w-full" style={{backgroundColor: '#52002d'}} onClick={handleNext}>Get Started</Button>
      }

      if (currentStep > 0 && !isLastForm) {
        return (
          <Button className="w-full" style={{backgroundColor: '#52002d'}} onClick={handleNext}>Continue</Button>
        );
      }
      
      if (isLastForm) {
        return (
          <Button className="w-full" style={{backgroundColor: '#52002d'}}>Pay QAR {totalPrice}</Button>
        )
      }
      return null;
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-muted/40">
            <div className="w-[375px] h-[812px] origin-center" style={{ transform: 'scale(0.9)' }}>
                <div className="w-full h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-black relative">
                    {renderHeader()}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
    
                    <ScrollArea className="h-full w-full pt-10">
                        <div className="bg-white pb-[96px] rounded-t-lg">
                           {renderContent()}
                        </div>
                    </ScrollArea>
                
                    <div className="absolute bottom-0 w-full bg-white p-4 border-t">
                        {renderFooter()}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FormEditorComponentProps {
    params: {formId: string}, 
    hideSaveButton?: boolean, 
    serviceId: string,
    onFormSwitch?: (newFormId: string) => void;
}

const FormEditorComponent = forwardRef(({params: {formId}, hideSaveButton = false, serviceId, onFormSwitch }: FormEditorComponentProps, ref) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  
  const [form, setForm] = useState<Partial<Form>>({
    name: 'Loading...',
    elements: [],
  });

  const [selectedElement, setSelectedElement] = useState<FormElement | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isElementSheetOpen, setIsElementSheetOpen] = useState(false);
  const [isPropertiesSheetOpen, setIsPropertiesSheetOpen] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [editorSelections, setEditorSelectionsState] = useState<Record<string, any>>({});

  const setEditorSelections = (id: string, value: any) => {
    setEditorSelectionsState(prev => ({...prev, [id]: value}));
  };
  
  
  const {
    data: initialForm,
    isLoading,
    isError,
  } = useQuery<Form>({
    queryKey: ['form', serviceId, formId],
    queryFn: async () => {
        if (!serviceId || !formId) throw new Error("Service ID and Form ID are required.");
        const form = await getForm(serviceId, formId);
        return form;
    },
    enabled: !!serviceId && !!formId,
  });

 useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
      if (initialForm.elements && initialForm.elements.length > 0) {
        const currentSelectedId = selectedElement?.id;
        const newSelectedElement = initialForm.elements.find(el => el.id === currentSelectedId) || initialForm.elements[0];
        setSelectedElement(newSelectedElement);
      } else {
        setSelectedElement(null);
      }
    }
  }, [initialForm]);

  useEffect(() => {
    if (selectedElement?.type === 'stepper' && selectedElement.options) {
      const totalMin = selectedElement.options.reduce((sum, opt) => sum + (opt.min ?? 0), 0);
      const newSelectedElement: FormElement = { ...selectedElement, totalMin };
  
      if (!selectedElement.noTotalMax) {
        const totalMax = selectedElement.options.reduce((sum, opt) => sum + (opt.max ?? 0), 0);
        newSelectedElement.totalMax = totalMax;
      } else {
        delete newSelectedElement.totalMax;
      }
  
      if (
        selectedElement.totalMin !== newSelectedElement.totalMin ||
        (!selectedElement.noTotalMax && selectedElement.totalMax !== newSelectedElement.totalMax)
      ) {
        setSelectedElement(newSelectedElement);
      }
    }
  }, [selectedElement?.options, selectedElement?.type, selectedElement?.noTotalMax, selectedElement?.totalMin, selectedElement?.totalMax]);

  const handleSelectElement = (element: FormElement) => {
    if (selectedElement) {
        setForm(prev => {
            if (!prev || !prev.elements) return prev;
            const newElements = prev.elements.map(el => 
                el.id === selectedElement.id ? selectedElement : el
            );
            return { ...prev, elements: newElements };
        });
    }
    
    setSelectedElement(element);

    if (isMobile) {
      setIsPropertiesSheetOpen(true);
    }
  };
  
  const onSave = () => {
    return new Promise((resolve, reject) => {
        if (!form || !serviceId || !formId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Cannot save form. Missing form or ID.',
            });
            return reject('Missing form or ID');
        }

        if (!form.name || form.name.trim() === '') {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Form title cannot be empty.',
            });
            return reject('Form title cannot be empty.');
        }

        let finalElements = form.elements || [];
        if (selectedElement) {
            finalElements = finalElements.map(el =>
                el.id === selectedElement.id ? selectedElement : el
            );
        }
        
        const finalForm = {
            ...form,
            elements: finalElements,
        };
        
        updateForm(serviceId, formId, {
            ...finalForm,
            updatedAt: new Date().toISOString(),
        }).then(() => {
            toast({
                title: 'Saved',
                description: 'Your form changes have been saved.',
            });
            queryClient.invalidateQueries({queryKey: ['form', serviceId, formId]});
            resolve('Saved successfully');
        }).catch((err) => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save changes.',
            });
            reject(err);
        });
    });
};


  useImperativeHandle(ref, () => ({
    saveForm: onSave
  }));

  const createNewElement = (type: FormElementType): FormElement => {
    const baseElement: FormElement = {
      id: uuidv4(),
      type: type,
      label: 'Untitled Question',
      required: false,
      helpText: '',
    };
    
    const choiceBased = ['multiple-choice', 'checkboxes', 'dropdown', 'toggle', 'rich-radio', 'accordion'].includes(type);
    const stepper = type === 'stepper';

    if (choiceBased) {
      baseElement.options = [
        {id: uuidv4(), value: 'Option 1', icon: 'Smile', description: 'This is a description', price: 0, fileUploadRequired: false},
        {id: uuidv4(), value: 'Option 2', icon: 'Clock', description: 'This is another description', price: 0, fileUploadRequired: false},
      ];
    } else if (stepper) {
       baseElement.options = [
        {id: uuidv4(), value: 'Adults', description: 'Ages 12+', min: 0, max: 10, price: 0 },
        {id: uuidv4(), value: 'Children', description: 'Ages 0-11', min: 0, max: 10, price: 0 },
      ];
      baseElement.totalMin = 0;
      baseElement.totalMax = 20;
    }

    return baseElement;
  };

  const addElement = (type: FormElementType) => {
    const newElement = createNewElement(type);
    
    // Save current element state before adding a new one
    let currentElements = form.elements || [];
    if (selectedElement) {
        currentElements = currentElements.map(el =>
            el.id === selectedElement.id ? selectedElement : el
        );
    }
    
    const newElements = [...currentElements, newElement];
    setForm(prev => ({ ...prev, elements: newElements }));
    setSelectedElement(newElement);

    if (isMobile) {
      setIsElementSheetOpen(false);
      setIsPropertiesSheetOpen(true);
    }
  };

  const moveElement = (index: number, direction: 'up' | 'down') => {
    if (!form.elements) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.elements.length) return;

    const newElements = [...form.elements];
    const [movedElement] = newElements.splice(index, 1);
    newElements.splice(newIndex, 0, movedElement);

    setForm(prev => ({...prev, elements: newElements}));
  };

  const handleElementPropertyChange = (
    property: keyof FormElement,
    value: any
  ) => {
    if (!selectedElement) return;
    setSelectedElement(prev => ({...prev!, [property]: value}));
  };
  
  const handleFormPropertyChange = (
    property: keyof Form,
    value: any
  ) => {
    setForm(prev => ({...prev, [property]: value}));
  };

  const handleOptionChange = (
    optionId: string,
    property: keyof FormElementOption,
    newValue: any
  ) => {
    if (!selectedElement) return;
    setSelectedElement(prev => {
      if (!prev) return prev;
      const updatedOptions = prev.options?.map(opt =>
        opt.id === optionId ? { ...opt, [property]: newValue } : opt
      );
      return { ...prev, options: updatedOptions };
    });
  };

  const addOption = () => {
    if (!selectedElement) return;
    const newOption: FormElementOption = {
      id: uuidv4(),
      value: `Option ${(selectedElement.options?.length || 0) + 1}`,
      icon: 'Smile',
      description: 'New item description',
      price: 0
    };

    if (selectedElement.type === 'accordion') {
        newOption.fileUploadRequired = false;
    }

    if (selectedElement.type === 'stepper') {
        newOption.min = 0;
        newOption.max = 10;
    }

    const newOptions = [...(selectedElement.options || []), newOption];
    setSelectedElement(prev => ({ ...prev!, options: newOptions }));
  };

  const removeOption = (optionId: string) => {
    if (!selectedElement) return;
    setSelectedElement(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options?.filter(opt => opt.id !== optionId),
      };
    });
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!selectedElement || !selectedElement.options) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedElement.options.length) return;

    const newOptions = [...selectedElement.options];
    const [movedOption] = newOptions.splice(index, 1);
    newOptions.splice(newIndex, 0, movedOption);

    setSelectedElement(prev => ({...prev!, options: newOptions}));
  };

  const deleteElement = (elementId?: string) => {
    const idToDelete = elementId || selectedElement?.id;
    if (!idToDelete) return;
    
    setForm(prev => {
      const updatedElements = prev.elements?.filter(el => el.id !== idToDelete) || [];
       if (selectedElement?.id === idToDelete) {
        const newSelectedIndex = prev.elements ? Math.max(0, prev.elements.findIndex(el => el.id === idToDelete) - 1) : 0;
        setSelectedElement(updatedElements.length > 0 ? updatedElements[newSelectedIndex] : null);
      }
      return {...prev, elements: updatedElements};
    });
    
    if (isMobile) {
      setIsPropertiesSheetOpen(false);
    }
  };

  const ElementPaletteContent = (
    <div className="p-4 bg-muted/40 h-full">
      <h3 className="mb-2 font-semibold">Elements</h3>
      <div className="mt-4 space-y-2">
        {AVAILABLE_FORM_ELEMENTS.map((el) => {
          const Icon = el.icon;
          return (
            <div
              key={el.type}
              className='flex items-center gap-3 p-3 border rounded-md bg-background cursor-pointer select-none'
              onClick={() => addElement(el.type)}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{el.label}</p>
                <p className="text-xs text-muted-foreground">
                  {el.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  
  const PropertiesPanelContent = (
      <div className="p-4 bg-muted/40 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Properties</h3>
           {selectedElement && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteElement()}
              className="h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        
      { !selectedElement ? (
         <p className="text-sm text-muted-foreground">
          Select an element to see its properties.
        </p>
      ) : (
      <div className="space-y-4">
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={selectedElement.label}
            onChange={(e) => handleElementPropertyChange('label', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="helpText">Help Text</Label>
          <Textarea
            id="helpText"
            value={selectedElement.helpText || ''}
            onChange={(e) => handleElementPropertyChange('helpText', e.target.value)}
          />
        </div>
        {selectedElement.type !== 'accordion' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={selectedElement.required}
              onCheckedChange={(checked) => handleElementPropertyChange('required', checked)}
            />
            <Label htmlFor="required">Required</Label>
          </div>
        )}


        {selectedElement.type === 'stepper' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Total Limits</Label>
              <div className="flex items-center gap-2">
                <Switch 
                  id="noTotalMax"
                  checked={selectedElement.noTotalMax}
                  onCheckedChange={(checked) => handleElementPropertyChange('noTotalMax', checked)}
                />
                <Label htmlFor="noTotalMax">No Limit</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Total Min"
                value={selectedElement.totalMin ?? ''}
                readOnly
                className="bg-muted"
              />
              {!selectedElement.noTotalMax && (
                <Input
                  type="number"
                  placeholder="Total Max"
                  value={selectedElement.totalMax ?? ''}
                  readOnly
                  className="bg-muted"
                />
              )}
            </div>
          </div>
        )}

        {(['dropdown', 'stepper', 'toggle', 'rich-radio', 'accordion', 'multiple-choice', 'checkboxes'].includes(selectedElement.type)) && (
          <div className="space-y-2">
            <Label>Options</Label>
             <RadioGroup 
                value={selectedElement.defaultValue} 
                onValueChange={(value) => handleElementPropertyChange('defaultValue', value)}
                className="space-y-2"
            >
            {selectedElement.options?.map((option, index) => {
              const isDefaultSelectionEnabled = ['multiple-choice', 'dropdown', 'toggle', 'rich-radio'].includes(selectedElement.type);
              return (
              <div key={option.id} className="flex flex-col gap-2 p-2 border rounded-md">
                 <div className="flex items-center gap-2">
                    {isDefaultSelectionEnabled && (
                        <div className='flex items-center h-10'>
                            <RadioGroupItem value={option.value} id={`default-${option.id}`} />
                        </div>
                    )}
                    <div className='flex items-center gap-2'>
                        {(selectedElement.type === 'rich-radio' || selectedElement.type === 'accordion') && (
                          <IconPicker
                            value={option.icon}
                            onChange={(icon) => handleOptionChange(option.id, 'icon', icon)}
                          />
                        )}
                    </div>
                    <div className='flex-grow space-y-2'>
                        <Input
                          placeholder={selectedElement.type === 'accordion' ? 'Item Title' : 'Option Value'}
                          value={option.value || ''}
                          onChange={(e) => handleOptionChange(option.id, 'value', e.target.value)}
                        />
                        {selectedElement.type !== 'stepper' && selectedElement.type !== 'accordion' && (
                            <div className="flex items-center border rounded-md overflow-hidden bg-background">
                                <div className="px-3 py-2 bg-zinc-100 border-r text-muted-foreground text-sm">
                                    QAR
                                </div>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={option.price ?? ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const parsed = parseFloat(value);
                                        handleOptionChange(option.id, 'price', isNaN(parsed) ? undefined : parsed);
                                    }}
                                    className="border-0 shadow-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveOption(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveOption(index, 'down')} disabled={index === (selectedElement.options?.length ?? 0) - 1}>
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                       className="h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                   {(selectedElement.type === 'accordion' || selectedElement.type === 'rich-radio' || selectedElement.type === 'stepper') && (
                     <Textarea
                        placeholder="Item Description"
                        value={option.description || ''}
                        onChange={(e) => handleOptionChange(option.id, 'description', e.target.value)}
                        className='h-20'
                     />
                   )}
                    {selectedElement.type === 'accordion' && (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`file-upload-${option.id}`}
                                checked={option.fileUploadRequired}
                                onCheckedChange={(checked) => handleOptionChange(option.id, 'fileUploadRequired', checked)}
                            />
                            <Label htmlFor={`file-upload-${option.id}`}>File Upload Required</Label>
                        </div>
                    )}
                   {selectedElement.type === 'stepper' && (
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center border rounded-md overflow-hidden bg-background">
                            <div className="px-3 py-2 bg-zinc-100 border-r text-muted-foreground text-sm">
                                QAR
                            </div>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="Price per item"
                                value={option.price ?? ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const parsed = parseFloat(value);
                                    handleOptionChange(option.id, 'price', isNaN(parsed) ? undefined : parsed);
                                }}
                                className="border-0 shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={option.min ?? ''}
                            onChange={(e) => handleOptionChange(option.id, 'min', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          />
                          {!selectedElement.noTotalMax && (
                            <Input
                              type="number"
                              placeholder="Max"
                              value={option.max ?? ''}
                              onChange={(e) => handleOptionChange(option.id, 'max', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            />
                          )}
                       </div>
                     </div>
                   )}
              </div>
            )})}
            </RadioGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              Add Option
            </Button>
          </div>
        )}
      </div>
      )}
      </div>
  );
  
  const EditorHeader = () => {
    const [isFormsSheetOpen, setIsFormsSheetOpen] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [formToDelete, setFormToDelete] = useState<Form | null>(null);

    const { data: serviceForms, isLoading: isLoadingServiceForms } = useQuery<Form[]>({
        queryKey: ['serviceForms', serviceId],
        queryFn: () => getFormsForService(serviceId),
        enabled: !!serviceId,
    });
    
    const reorderFormMutation = useMutation({
        mutationFn: async ({ reorderedForms }: { reorderedForms: Form[] }) => {
            if (!serviceId) return;
            const batch = writeBatch(db);
            reorderedForms.forEach((form, index) => {
                if (!form.id) return;
                const formRef = doc(db, 'services', serviceId, 'requirements', form.id);
                batch.update(formRef, { order: index });
            });
            await batch.commit();
        },
        onMutate: async ({ reorderedForms }) => {
            await queryClient.cancelQueries({ queryKey: ['serviceForms', serviceId] });
            const previousForms = queryClient.getQueryData<Form[]>(['serviceForms', serviceId]);
            queryClient.setQueryData(['serviceForms', serviceId], reorderedForms);
            return { previousForms };
        },
        onError: (err, variables, context) => {
            if (context?.previousForms) {
                queryClient.setQueryData(['serviceForms', serviceId], context.previousForms);
            }
            toast({ variant: 'destructive', title: 'Error', description: 'Could not reorder forms.' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceForms', serviceId] });
        },
    });

    const createNewFormMutation = useMutation({
        mutationFn: (name: string) => {
          if (!serviceId) throw new Error("Service ID is required.");
          const newOrder = serviceForms?.length || 0;
          return createNewFormForService(serviceId, name, newOrder);
        },
        onSuccess: (newFormId) => {
          queryClient.invalidateQueries({queryKey: ['serviceForms', serviceId]});
            if (onFormSwitch) {
                onFormSwitch(newFormId);
            } else {
                router.push(`/apps/formbuilder/forms/${newFormId}/edit?serviceId=${serviceId}`);
            }
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create new form.'
          });
        }
      });
    
       const deleteFormMutation = useMutation({
        mutationFn: (form: Form) => {
          if (!form.serviceId || !form.id) throw new Error('Cannot delete form without serviceId and formId');
          const remainingForms = serviceForms?.filter(f => f.id !== form.id) || [];
          return deleteForm(form.serviceId, form.id, remainingForms);
        },
        onSuccess: (_, deletedForm) => {
          toast({title: 'Form Deleted'});
          queryClient.invalidateQueries({queryKey: ['serviceForms', serviceId]});
          
          const remainingForms = serviceForms?.filter(f => f.id !== deletedForm.id);
          if (formId === deletedForm.id) {
              if (remainingForms && remainingForms.length > 0) {
                const sorted = remainingForms.sort((a,b) => (a.order || 0) - (b.order || 0));
                const nextFormId = sorted[0].id;
                 if (onFormSwitch) {
                    onFormSwitch(nextFormId!);
                } else {
                    router.push(`/apps/formbuilder/forms/${nextFormId}/edit?serviceId=${serviceId}`);
                }
              } else {
                 if (onFormSwitch) {
                    // This case should be handled by the parent component (e.g. wizard)
                 } else {
                    router.push('/apps/formbuilder/forms');
                 }
              }
          }
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete form.'
          });
        }
       });

    const handleCreateNewForm = () => {
        const newFormName = `Form #${(serviceForms?.length || 0) + 1}`;
        createNewFormMutation.mutate(newFormName);
    };
    
    const handleDeleteFormClick = (form: Form) => {
        setFormToDelete(form);
        setShowDeleteAlert(true);
    };

    const handleConfirmDelete = () => {
        if (formToDelete) {
            deleteFormMutation.mutate(formToDelete);
        }
        setShowDeleteAlert(false);
        setFormToDelete(null);
    };

    const handleReorderForm = (direction: 'up' | 'down', formToMove: Form) => {
        if (!serviceForms) return;
        const sortedForms = [...serviceForms].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const currentIndex = sortedForms.findIndex(f => f.id === formToMove.id);
        
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= sortedForms.length) return;
        
        const reorderedForms = [...sortedForms];
        const [movedItem] = reorderedForms.splice(currentIndex, 1);
        reorderedForms.splice(newIndex, 0, movedItem);

        reorderFormMutation.mutate({ reorderedForms });
    };
    
    const currentFormIndex = (serviceForms || []).sort((a,b) => (a.order || 0) - (b.order || 0)).findIndex(f => f.id === formId);

    return (
        <>
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 gap-4">
                <div className="flex items-center gap-2">
                    {isMobile && (
                    <Sheet open={isElementSheetOpen} onOpenChange={setIsElementSheetOpen}>
                        <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>Elements</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100%-4rem)]">{ElementPaletteContent}</ScrollArea>
                        </SheetContent>
                    </Sheet>
                    )}
                    <h1 className="text-xl font-semibold hidden sm:block">Form Editor</h1>
                    <Dialog open={isFormsSheetOpen} onOpenChange={setIsFormsSheetOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-shrink-0">
                            {form?.name || "Select Form"} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Forms</DialogTitle>
                                <DialogDescription>
                                    Reorder, create, or delete forms for this service.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {isLoadingServiceForms ? (
                                    <div className="flex justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /></div>
                                ) : (
                                    <div className="space-y-2">
                                    {(serviceForms || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((f, index) => {
                                        const formName = f.id === formId ? form?.name : f.name;
                                        return (
                                            <div 
                                                key={f.id} 
                                                className="flex items-center justify-between p-2 border rounded-md cursor-pointer"
                                                onClick={() => {
                                                    if (f.id !== formId && onFormSwitch) {
                                                        onFormSwitch(f.id!);
                                                    }
                                                    setIsFormsSheetOpen(false);
                                                }}
                                            >
                                                <span 
                                                    className={cn("font-medium", f.id === formId && "text-primary")}
                                                >
                                                    {formName}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleReorderForm('up', f)}} disabled={index === 0}>
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleReorderForm('down', f)}} disabled={index === (serviceForms?.length || 0) - 1}>
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                    {(serviceForms?.length || 0) > 1 && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteFormClick(f)}}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    </div>
                                )}
                                <Button 
                                    variant="outline" 
                                    className="w-full mt-4"
                                    onClick={handleCreateNewForm}
                                    disabled={createNewFormMutation.isPending}
                                >
                                    {createNewFormMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Create New Form
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-nowrap items-center gap-2">
                    <Button onClick={onSave} disabled={isSaving} className={cn("flex-shrink-0")}>
                        {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>

                    <Dialog open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-shrink-0">
                                <Smartphone className="mr-2 h-4 w-4" />
                                Preview
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="h-[90vh] max-h-[850px] w-[90vw] max-w-[420px] p-0 flex items-center justify-center">
                            <DialogHeader>
                              <DialogTitle className="sr-only">Mobile Preview</DialogTitle>
                            </DialogHeader>
                           {serviceId && <ServiceFlowPreview serviceId={serviceId} initialStep={currentFormIndex > -1 ? currentFormIndex + 1 : 0}/>}
                        </DialogContent>
                    </Dialog>

                    {isMobile && (
                    <Sheet open={isPropertiesSheetOpen} onOpenChange={setIsPropertiesSheetOpen}>
                        <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <PanelRight className="h-5 w-5" />
                        </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>Properties</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100%-4rem)]">{PropertiesPanelContent}</ScrollArea>
                        </SheetContent>
                    </Sheet>
                    )}
                </div>
            </header>
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    form {'"'}
                    {formToDelete?.name}
                    {'"'} and all of its responses.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleConfirmDelete}
                    >
                    Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
  }
  
  if (!serviceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Service ID is required to load the form.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isError) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-destructive">Failed to load form data. Please ensure the service and form exist.</p>
        </div>
      );
  }


  return (
     <div className="h-screen flex flex-col bg-background">
      <EditorHeader />
      <div className="flex-1 grid md:grid-cols-[250px_1fr_350px] overflow-hidden h-[calc(100vh-4rem)]">
        <aside className="hidden md:block border-r bg-background overflow-y-auto">
            <ScrollArea className="h-full">
                {ElementPaletteContent}
            </ScrollArea>
        </aside>
        <main className="overflow-y-auto">
            <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto bg-white border-x min-h-full">
                    <div className="p-4 border-b">
                         <Label htmlFor="formTitle">Form Title</Label>
                         <Input
                            id="formTitle"
                            placeholder="Edit Form Title"
                            value={form?.name || ''}
                            onChange={(e) => handleFormPropertyChange('name', e.target.value)}
                            className="h-9"
                          />
                    </div>
                    <div className="min-h-[400px] transition-colors duration-200">
                    {(form.elements || []).map((element, index) => {
                        const elementToRender = (selectedElement?.id === element.id && selectedElement) ? selectedElement : element;

                        return (
                        <div
                            key={element.id}
                            className="group relative flex items-stretch bg-background"
                        >
                            <div className="flex-grow">
                            {renderFormElement(
                                elementToRender,
                                selectedElement?.id === element.id,
                                () => handleSelectElement(element),
                                false,
                                editorSelections,
                                setEditorSelections
                            )}
                            </div>
                            <div
                            className={cn(
                                "flex flex-col items-start justify-start px-1 pt-4 gap-1 transition-opacity bg-muted/50",
                                selectedElement?.id === element.id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            )}
                            >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveElement(index, 'up')}
                                disabled={index === 0}
                                className="h-7 w-7"
                            >
                                <ArrowUp className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveElement(index, 'down')}
                                disabled={index === (form.elements?.length || 0) - 1}
                                className="h-7 w-7"
                            >
                                <ArrowDown className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteElement(element.id)}
                                className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                            </div>
                        </div>
                        );
                    })}
                    {(!form.elements || form.elements.length === 0) && (
                        <div className="flex items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-md text-muted-foreground m-4">
                        <p>Click on an element to add it here</p>
                        </div>
                    )}
                    </div>
                </div>
            </ScrollArea>
        </main>
        <aside className="hidden md:block border-l bg-background overflow-y-auto">
            <ScrollArea className="h-full">
                {PropertiesPanelContent}
            </ScrollArea>
        </aside>
      </div>
    </div>
  );
});

FormEditorComponent.displayName = 'FormEditorComponent';


export interface FormEditorRef {
    saveForm: () => Promise<any>;
}

function FormEditorPage(
    {params, hideSaveButton, serviceId, onFormSwitch}: {
        params: {formId: string}, 
        hideSaveButton?: boolean, 
        serviceId?: string,
        onFormSwitch?: (newFormId: string) => void;
    }, 
    ref: React.Ref<FormEditorRef>
) {
    if (!serviceId) {
        return (
             <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <FormIdFetcher params={params} hideSaveButton={hideSaveButton} onFormSwitch={onFormSwitch} ref={ref} />
             </Suspense>
        );
    }

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <FormEditorComponent params={params} hideSaveButton={hideSaveButton} serviceId={serviceId} onFormSwitch={onFormSwitch} ref={ref}/>
        </Suspense>
    )
}

export default forwardRef(FormEditorPage);

const FormIdFetcher = forwardRef(({params, hideSaveButton = false, onFormSwitch}: {params: {formId: string}, hideSaveButton?: boolean, onFormSwitch?: (newFormId: string) => void}, ref: React.Ref<FormEditorRef>) => {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    
    if (!serviceId) {
        return <div className="flex items-center justify-center h-full"><p className="text-destructive">Service ID is missing in URL.</p></div>;
    }

    return <FormEditorComponent params={params} hideSaveButton={hideSaveButton} serviceId={serviceId} onFormSwitch={onFormSwitch} ref={ref}/>
})
FormIdFetcher.displayName = 'FormIdFetcher';

    

    

    



    
