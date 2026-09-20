
'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Upload, Video, PlusCircle, Trash2, X, ArrowUp, ArrowDown, Smartphone, Loader2, Play, Eye, Save, ChevronLeft, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconPicker } from '@/components/icon-picker';
import { DynamicIcon } from '@/components/dynamic-icon';
import { getServiceDetails, updateServiceDetails, ServiceDetails, getOrCreateServiceDetailsId } from '@/lib/firebaseService/service-details';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { uploadFileClient as uploadFile, deleteFileClient as deleteFile } from '@/lib/storage-client';
import { getServiceById, Service, getServices } from '@/lib/services';
import { getForm, getFormsForService } from '@/lib/firebaseService/forms';
import type { Form, FormElement, FormElementOption } from '@/types/forms';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchParams } from 'next/navigation';

const queryClient = new QueryClient();

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface ServiceDetailPageBuilderProps {
  serviceId: string;
}

const defaultServiceDetails: Partial<ServiceDetails> = {
  bannerImage: null,
  videoUrl: '',
  videoThumbnailUrl: '',
  serviceCategory: 'Residency Services',
  serviceTitle: 'E-Visa & Visa on Arrival',
  showHighlight: true,
  description: 'Update your residency visa easily and get real-time status updates, all from your phone. Easily renew your residency visa online without the hassle. Submit your documents, track your application, and receive updates, all in one place. Renew your residency visa quickly and securely through the Mandobak app. Access up-to-date information, submit required documents, and track your application status, all in one place, anytime.',
  highlightTitle: 'Express 1-2 working days',
  highlightNote: 'Only available Mon-Fri from 9am-4pm',
  highlightText: 'Express Services Available',
  highlightIcon: 'Clock',
  faqs: [
      { id: 1, question: 'Who can renew a visa through the Mandobak app?', answer: 'Residents of Qatar with valid residence permits and registered sponsors can use Mandobak to renew their visas conveniently.' },
      { id: 2, question: 'When should I start the visa renewal process?', answer: 'It is recommended to start the renewal process at least one month before your current visa expires.' },
      { id: 3, question: 'What documents are needed for visa renewal?', answer: 'Typically, you will need a copy of your passport, current visa, and a recent photograph. Specific requirements may vary.' },
  ],
};


const ServiceFlowPreview = ({ serviceId, initialStep = 0, overrideDetails }: { serviceId: string, initialStep?: number, overrideDetails?: Partial<ServiceDetails> }) => {
    const [currentStep, setCurrentStep] = useState(initialStep); // 0 is service details, 1+ are forms
    const [watchedValues, setWatchedValues] = useState<Record<string, any>>({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const { data: fetchResult, isLoading, isError } = useQuery({
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

    // Merge fetched and overridden details for immediate preview feedback
    const data = fetchResult ? {
        ...fetchResult,
        details: overrideDetails ? { ...fetchResult.details, ...overrideDetails } : fetchResult.details
    } : null;

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
                            if (selectedOption?.price) {
                                optionsPrice += selectedOption.price;
                            }
                        } else if (element.type === 'checkboxes' && typeof value === 'object') {
                            for (const optionId in value) {
                                if (value[optionId]) {
                                    const selectedOption = element.options.find(opt => opt.id === optionId);
                                    if (selectedOption?.price) {
                                        optionsPrice += selectedOption.price;
                                    }
                                }
                            }
                        } else if (element.type === 'stepper' && typeof value === 'object') {
                            for (const optionId in value) {
                                const qty = value[optionId] || 0;
                                if (qty > 0) {
                                    const selectedOption = element.options.find(opt => opt.id === optionId);
                                    if (selectedOption?.price) {
                                        optionsPrice += selectedOption.price * qty;
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

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (isError || !data) return <div className="flex items-center justify-center h-full"><p className="text-destructive">Failed to load preview.</p></div>;

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
                    {element.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {element.helpText && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {element.helpText}
                    </p>
                  )}
                  <div className="mt-3">
                  {(() => {
                    switch (element.type) {
                      case 'short-answer':
                        return <Input placeholder={element.placeholder} />;
                      case 'long-answer':
                        return <Textarea placeholder={element.placeholder} />;
                      case 'multiple-choice':
                        return (
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
                        );
                      case 'checkboxes':
                        return (
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
                        );
                      case 'dropdown':
                        return (
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
                        );
                      case 'toggle':
                        return (
                          <div className="flex flex-wrap gap-2">
                            {element.options?.map(opt => (
                              <Button key={opt.id} type="button" variant={(watchedValues[element.id] ?? element.defaultValue) === opt.value ? 'default' : 'outline'} className="rounded-full" onClick={() => setValue(element.id, opt.value)}>
                                {opt.value}{opt.price && opt.price > 0 ? ` (+QAR ${opt.price})` : ''}
                              </Button>
                            ))}
                          </div>
                        );
                      case 'rich-radio':
                        return (
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
                        );
                      case 'accordion':
                        return (
                          <Accordion type="single" collapsible className="w-full">
                            {element.options?.map((opt) => (
                              <AccordionItem value={opt.id} key={opt.id}>
                                <AccordionTrigger>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                      {opt.icon && <DynamicIcon iconName={opt.icon} className="h-5 w-5 text-muted-foreground"/>}
                                      {opt.value}
                                    </div>
                                    {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium mr-2">+QAR {opt.price}</span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <p className="text-sm text-muted-foreground pl-8">{opt.description}</p>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        );
                      case 'stepper':
                        return (() => {
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
                          );
                        })();
                      default:
                        return null;
                    }
                  })()}
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

export const ServiceDetailPageBuilder = forwardRef<any, ServiceDetailPageBuilderProps>(({ serviceId }: ServiceDetailPageBuilderProps, ref) => {
  const queryClient = useQueryClient();
  const { data: initialDetails, isLoading, isError } = useQuery<Partial<ServiceDetails> | null>({
    queryKey: ['serviceDetails', serviceId],
    queryFn: () => getServiceDetails(serviceId),
    enabled: !!serviceId,
    refetchOnWindowFocus: false,
  });

  const [details, setDetails] = useState<Partial<ServiceDetails>>({});
  const [previews, setPreviews] = useState<{bannerImage?: string, videoThumbnailUrl?: string}>({});

  useEffect(() => {
    if (initialDetails) {
      // Aggressively scrub any existing Base64 from the fetched data
      const scrubbed = { ...initialDetails };
      const mediaFields: (keyof ServiceDetails)[] = ['bannerImage', 'videoThumbnailUrl', 'videoUrl'];
      let needsStateUpdate = false;

      mediaFields.forEach(field => {
        if (typeof scrubbed[field] === 'string' && scrubbed[field].startsWith('data:')) {
            scrubbed[field] = null;
            needsStateUpdate = true;
        }
      });

      // Only update if there's a change or if details haven't been initialized yet
      // This prevents overwriting user edits with stale initialDetails if they've already started editing
      setDetails(prev => {
        if (needsStateUpdate || Object.keys(prev).length === 0) {
          return { ...scrubbed, ...prev }; // Merge in case they already started editing
        }
        return prev;
      });
    } else if (!isLoading && !isError && Object.keys(details).length === 0) {
      setDetails(defaultServiceDetails);
    }
  }, [initialDetails, isLoading, isError]);
  // No-op observer. The logic has been moved to handleBannerChange etc. to prevent circular loops.


  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isVideoThumbnailUploading, setIsVideoThumbnailUploading] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  
  const updateDetailsMutation = useMutation({
    mutationFn: (newDetails: Partial<ServiceDetails>) => {
      if (!serviceId) throw new Error("Service ID is required.");
      
      const sanitizedDetails = { ...newDetails };
      const mediaFields: (keyof ServiceDetails)[] = ['bannerImage', 'videoThumbnailUrl', 'videoUrl'];
      
      let hasBase64 = false;
      mediaFields.forEach(field => {
        if (typeof sanitizedDetails[field] === 'string' && sanitizedDetails[field].startsWith('data:')) {
            hasBase64 = true;
        }
      });

      if (hasBase64) {
          throw new Error("One or more media files are still uploading or failed to upload. Please try again.");
      }

      return updateServiceDetails(serviceId, sanitizedDetails);
    },
    onMutate: async (newDetails) => {
      await queryClient.cancelQueries({ queryKey: ['serviceDetails', serviceId] });
      const previousDetails = queryClient.getQueryData(['serviceDetails', serviceId]);
      queryClient.setQueryData(['serviceDetails', serviceId], (old: any) => ({...old, ...newDetails}));
      return { previousDetails };
    },
    onError: (err, newDetails, context) => {
      if (context?.previousDetails) {
        queryClient.setQueryData(['serviceDetails', serviceId], context.previousDetails);
      }
      toast({ variant: 'destructive', title: 'Error', description: (err as Error).message });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Service details saved.' });
      queryClient.invalidateQueries({ queryKey: ['serviceDetails', serviceId] });
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['serviceDetails', serviceId] });
    },
  });

  useImperativeHandle(ref, () => ({
    getDetails: () => details,
    saveDetails: async () => {
        // Ensure we handle any pending uploads if necessary, 
        // but the UI already disables the save button.
        return updateDetailsMutation.mutateAsync(details);
    }
  }), [details, updateDetailsMutation]);


  const handleDetailChange = (field: keyof ServiceDetails, value: any) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show immediate preview
    const reader = new FileReader();
    reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, bannerImage: reader.result as string }));
    };
    reader.readAsDataURL(file);

    setIsBannerUploading(true);
    try {
        const oldUrl = details.bannerImage;
        const downloadUrl = await uploadFile(file, `services/${serviceId}`, 'banner');
        
        // 1. Update local state
        setDetails(prev => ({ ...prev, bannerImage: downloadUrl }));
        
        // 2. Immediate update via mutation (handles Firestore + Query Cache)
        await updateDetailsMutation.mutateAsync({ bannerImage: downloadUrl });

        // Clear preview
        setPreviews(prev => ({ ...prev, bannerImage: undefined }));
        
        // Delete old file if it was successful and exists in Firebase Storage AND is different from new one
        if (oldUrl && oldUrl !== downloadUrl) {
            await deleteFile(oldUrl);
        }

        toast({ title: 'Success', description: 'Banner uploaded and updated.' });
    } catch (error) {
        console.error("Error uploading banner:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Failed to upload banner.' });
        setPreviews(prev => ({ ...prev, bannerImage: undefined }));
    } finally {
        setIsBannerUploading(false);
    }
  };
  
  const handleVideoThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show immediate preview
    const reader = new FileReader();
    reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, videoThumbnailUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);

    setIsVideoThumbnailUploading(true);
    try {
        const oldUrl = details.videoThumbnailUrl;
        const downloadUrl = await uploadFile(file, `services/${serviceId}/details_videos`, 'video_thumbnail');
        
        // 1. Update local state
        setDetails(prev => ({ ...prev, videoThumbnailUrl: downloadUrl }));
        
        // 2. Immediate update via mutation (handles Firestore + Query Cache)
        await updateDetailsMutation.mutateAsync({ videoThumbnailUrl: downloadUrl });

        // Clear preview
        setPreviews(prev => ({ ...prev, videoThumbnailUrl: undefined }));
        
        // Delete old file if it was successful and exists in Firebase Storage AND is different from new one
        if (oldUrl && oldUrl !== downloadUrl) {
            await deleteFile(oldUrl);
        }

        toast({ title: 'Success', description: 'Thumbnail uploaded and updated.' });
    } catch (error) {
        console.error("Error uploading thumbnail:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Failed to upload thumbnail.' });
        setPreviews(prev => ({ ...prev, videoThumbnailUrl: undefined }));
    } finally {
        setIsVideoThumbnailUploading(false);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limit video size (50MB)
    if (file.size > 50 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: 'Videos must be under 50MB.' });
        return;
    }

    setIsVideoUploading(true);
    try {
      const oldUrl = details.videoUrl;
      const downloadUrl = await uploadFile(file, `services/${serviceId}/details_videos`, 'video');
      
      // 1. Update local state
      setDetails(prev => ({ ...prev, videoUrl: downloadUrl }));
      
      // 2. Immediate update via mutation (handles Firestore + Query Cache)
      await updateDetailsMutation.mutateAsync({ videoUrl: downloadUrl });

      // Delete old file if it was successful and exists in Firebase Storage AND is different from new one
      if (oldUrl && oldUrl !== downloadUrl) {
          await deleteFile(oldUrl);
      }

      toast({ title: 'Success', description: 'Video uploaded and updated.' });
    } catch (error) {
       console.error("Error uploading video:", error);
       toast({ 
           variant: 'destructive', 
           title: 'Upload Failed', 
           description: (error as any)?.message || 'Failed to upload video.' 
       });
    } finally {
      setIsVideoUploading(false);
    }
  };


  const addFaq = () => {
    const faqs = details.faqs || [];
    handleDetailChange('faqs', [...faqs, { id: Date.now(), question: 'New Question', answer: 'New Answer' }]);
  };

  const removeFaq = (id: number) => {
    const faqs = details.faqs || [];
    handleDetailChange('faqs', faqs.filter((faq) => faq.id !== id));
  };

  const updateFaq = (id: number, field: 'question' | 'answer', value: string) => {
    const faqs = details.faqs || [];
    handleDetailChange('faqs', faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)));
  };

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const faqs = [...(details.faqs || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < faqs.length) {
      const [movedFaq] = faqs.splice(index, 1);
      faqs.splice(newIndex, 0, movedFaq);
      handleDetailChange('faqs', faqs);
    }
  };

  const editorPanel = (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="bg-muted p-4">
          <CardTitle className="text-lg">Banner</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label htmlFor="banner-image">Banner Image</Label>
            <div className="flex items-center gap-4">
              {(previews.bannerImage || details.bannerImage) && (
                <img
                  src={previews.bannerImage || details.bannerImage || ''}
                  alt="Banner Preview"
                  width={100}
                  height={60}
                  className="rounded-md object-cover border"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <Input
                id="banner-image"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="flex-1"
                disabled={isBannerUploading}
              />
              {isBannerUploading && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {details.bannerImage && !isBannerUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                      const oldUrl = details.bannerImage;
                      handleDetailChange('bannerImage', null);
                      await updateDetailsMutation.mutateAsync({ bannerImage: null });
                      if (oldUrl) await deleteFile(oldUrl);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted p-4">
          <CardTitle className="text-lg">Content</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-category">Service Category</Label>
              <Input
                id="service-category"
                value={details.serviceCategory || ''}
                onChange={(e) =>
                  handleDetailChange('serviceCategory', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-title">Service Title</Label>
              <Input
                id="service-title"
                value={details.serviceTitle || ''}
                onChange={(e) =>
                  handleDetailChange('serviceTitle', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={details.description || ''}
                onChange={(e) =>
                  handleDetailChange('description', e.target.value)
                }
                className="h-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Highlight Card</CardTitle>
            <Switch
              checked={details.showHighlight}
              onCheckedChange={(checked) =>
                handleDetailChange('showHighlight', checked)
              }
            />
          </div>
        </CardHeader>
        {details.showHighlight && (
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="highlight-text"
                  placeholder="Highlight Badge Text"
                  value={details.highlightText || ''}
                  onChange={(e) =>
                    handleDetailChange('highlightText', e.target.value)
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <IconPicker
                  value={details.highlightIcon}
                  onChange={(icon) => handleDetailChange('highlightIcon', icon)}
                />
                <Input
                  id="highlight-title"
                  placeholder="Highlight Title (e.g. Express)"
                  value={details.highlightTitle || ''}
                  onChange={(e) =>
                    handleDetailChange('highlightTitle', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="highlight-note"
                  placeholder="Highlight Note"
                  value={details.highlightNote || ''}
                  onChange={(e) =>
                    handleDetailChange('highlightNote', e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="bg-muted p-4">
          <CardTitle className="text-lg">Video</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-thumbnail">Video Thumbnail</Label>
            <div className="flex items-center gap-4">
              {(previews.videoThumbnailUrl || details.videoThumbnailUrl) && (
                <img
                  src={previews.videoThumbnailUrl || details.videoThumbnailUrl || ''}
                  alt="Thumbnail Preview"
                  width={100}
                  height={60}
                  className="rounded-md object-cover border"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
                <Input
                  id="video-thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleVideoThumbnailChange}
                  className="flex-1"
                  disabled={isVideoThumbnailUploading}
                />
                {isVideoThumbnailUploading && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {details.videoThumbnailUrl && !isVideoThumbnailUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                        const oldUrl = details.videoThumbnailUrl;
                        handleDetailChange('videoThumbnailUrl', '');
                        await updateDetailsMutation.mutateAsync({ videoThumbnailUrl: '' });
                        if (oldUrl) await deleteFile(oldUrl);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-url">Video (Optional)</Label>
              <div className="flex items-center gap-4">
                {details.videoUrl && (
                  <video
                    src={details.videoUrl}
                    width="100"
                    height="60"
                    className="rounded-md object-cover"
                  />
                )}
                <Input
                  id="video-url"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="flex-1"
                  disabled={isVideoUploading}
                />
                {isVideoUploading && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {details.videoUrl && !isVideoUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                        const oldUrl = details.videoUrl;
                        handleDetailChange('videoUrl', '');
                        await updateDetailsMutation.mutateAsync({ videoUrl: '' });
                        if (oldUrl) await deleteFile(oldUrl);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">FAQs</CardTitle>
            <Button size="sm" variant="outline" onClick={addFaq}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {details.faqs?.map((faq, index) => (
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
                    onClick={() => moveFaq(index, 'up')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === (details.faqs?.length || 0) - 1}
                    onClick={() => moveFaq(index, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFaq(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-q-${faq.id}`}>Question</Label>
                  <Input
                    id={`faq-q-${faq.id}`}
                    value={faq.question}
                    onChange={(e) =>
                      updateFaq(faq.id, 'question', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-a-${faq.id}`}>Answer</Label>
                  <Textarea
                    id={`faq-a-${faq.id}`}
                    value={faq.answer}
                    onChange={(e) =>
                      updateFaq(faq.id, 'answer', e.target.value)
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
  
  
  if (!serviceId) {
      return (
          <div className="flex items-center justify-center h-full">
              <p className="text-destructive">Service ID is required.</p>
          </div>
      );
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (isError) {
      return (
          <div className="flex items-center justify-center h-full">
              <p className="text-destructive">Failed to load service details.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background">
     <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background p-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Service Page Builder</h1>
      </div>
      <div className="flex items-center gap-2">
          <Button 
            onClick={() => updateDetailsMutation.mutate(details)} 
            disabled={updateDetailsMutation.isPending || isBannerUploading || isVideoUploading || isVideoThumbnailUploading}
          >
            {updateDetailsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             {isBannerUploading || isVideoUploading || isVideoThumbnailUploading ? 'Uploading...' : 'Save Changes'}
          </Button>
          <Dialog open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Preview
                </Button>
            </DialogTrigger>
            <DialogContent className="h-[90vh] max-h-[850px] w-[90vw] max-w-[420px] p-0 flex items-center justify-center">
              <DialogHeader>
                  <DialogTitle className="sr-only">Mobile Preview</DialogTitle>
              </DialogHeader>
              <div className="w-full h-full relative">
                <ServiceFlowPreview 
                    serviceId={serviceId} 
                    overrideDetails={{...details, ...previews}} 
                />
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </header>
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {editorPanel}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
ServiceDetailPageBuilder.displayName = 'ServiceDetailPageBuilder';


const ServiceDetailFetcher = () => {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
        return <div className="flex items-center justify-center h-full"><p className="text-destructive">Service ID is missing from URL.</p></div>;
    }

    return <ServiceDetailPageBuilder serviceId={serviceId} />;
}

export default function ServiceDetailPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <ServiceDetailFetcher />
            </Suspense>
        </QueryClientProvider>
    );
}

    