

'use client';

import {useState, useEffect} from 'react';
import { useSearchParams } from 'next/navigation'
import {useQuery, useMutation} from '@tanstack/react-query';
import {getForm, addFormResponse} from '@/lib/firebaseService/forms';
import { getServiceById, Service } from '@/lib/services';
import {useForm, Controller} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Checkbox} from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Loader2, CheckCircle, Plus, Minus, Clock} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import type {Form, FormElement, FormElementOption} from '@/types/forms';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/dynamic-icon';

const getOptionLabel = (opt: FormElementOption) => {
    return opt.value;
};

const StepperInput = ({
  options,
  control,
  elementId,
  totalMin,
  totalMax,
  noTotalMax,
}: {
  options: FormElementOption[];
  control: any;
  elementId: string;
  totalMin?: number;
  totalMax?: number;
  noTotalMax?: boolean;
}) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    options.forEach(opt => {
      initial[opt.id] = opt.min ?? 0;
    });
    return initial;
  });

  const totalValue = Object.values(values).reduce((sum, val) => sum + val, 0);

  const isTotalMinError = totalMin !== undefined && totalValue < totalMin;
  const isTotalMaxError = !noTotalMax && totalMax !== undefined && totalValue > totalMax;

  useEffect(() => {
    control.setValue(elementId, values);
  }, [values, control, elementId]);

  const updateValue = (id: string, delta: number) => {
    setValues(prev => {
        const option = options.find(o => o.id === id);
        const currentVal = prev[id] || 0;
        const newVal = currentVal + delta;
        const min = option?.min ?? 0;
        const max = option?.max ?? Infinity;

        if (newVal < min || newVal > max) {
            return prev;
        }

        return {
            ...prev,
            [id]: newVal,
        };
    });
  };

  return (
    <div className="space-y-3">
      {options.map(opt => {
        const value = values[opt.id] || 0;
        const canDecrement = value > (opt.min ?? 0);
        const max = noTotalMax ? Infinity : (opt.max ?? Infinity);
        const canIncrement = value < max;
        
        return (
            <div key={opt.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
                <p className="font-medium">{opt.value}</p>
                {opt.price && opt.price > 0 && value > 0 && <p className="text-xs text-muted-foreground">+QAR {opt.price * value}</p>}
            </div>
            <div className="flex items-center gap-2">
                <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateValue(opt.id, -1)}
                disabled={!canDecrement}
                >
                <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold w-4 text-center">{value}</span>
                <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateValue(opt.id, 1)}
                disabled={!canIncrement}
                >
                <Plus className="h-4 w-4" />
                </Button>
            </div>
            </div>
        )
      })}
      {isTotalMinError && <p className="text-sm text-destructive">Total must be at least {totalMin}.</p>}
      {isTotalMaxError && <p className="text-sm text-destructive">Total must be at most {totalMax}.</p>}
    </div>
  );
};


export default function ViewFormPage({params}: {params: {formId: string}}) {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    data: initialData,
    isLoading,
    isError,
  } = useQuery<{form: Form, service: Service}>({
    queryKey: ['formWithService', serviceId, params.formId],
    queryFn: async () => {
        if (!serviceId) throw new Error("Service ID is required.");
        const form = await getForm(serviceId, params.formId);
        const service = await getServiceById(serviceId);
        if (!service) throw new Error("Service not found");
        return { form, service };
    },
    staleTime: Infinity,
    enabled: !!serviceId,
  });

  const { form, service } = initialData || {};

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: {errors},
  } = useForm();
  
  const watchedValues = watch();

   useEffect(() => {
    if (form && service) {
      const basePrice = service.basePrice || 0;
      let optionsPrice = 0;
      
      form.elements.forEach(element => {
        const value = watchedValues[element.id];
        if (value && element.options) {
          if (element.type === 'multiple-choice' || element.type === 'dropdown' || element.type === 'rich-radio' || element.type === 'toggle') {
            const selectedOption = element.options.find(opt => opt.value === value);
            if (selectedOption && selectedOption.price) {
              optionsPrice += selectedOption.price;
            }
          } else if (element.type === 'checkboxes' && typeof value === 'object') {
            for (const optionId in value) {
              if (value[optionId]) {
                const selectedOption = element.options.find(opt => opt.id === optionId);
                if (selectedOption && selectedOption.price) {
                  optionsPrice += selectedOption.price;
                }
              }
            }
          } else if (element.type === 'stepper' && typeof value === 'object') {
             for (const optionId in value) {
                const optionValue = value[optionId];
                if (optionValue > 0) {
                    const selectedOption = element.options.find(opt => opt.id === optionId);
                    if (selectedOption && selectedOption.price) {
                        optionsPrice += selectedOption.price * optionValue;
                    }
                }
             }
          }
        }
      });
      
      setTotalPrice(basePrice + optionsPrice);
    }
  }, [watchedValues, form, service]);

  useEffect(() => {
    if (form && service) {
        setTotalPrice(service.basePrice || 0);
        form.elements.forEach(element => {
            const currentValue = watchedValues[element.id];
            if (!currentValue && element.defaultValue) {
                setValue(element.id, element.defaultValue);
            }
        });
    }
  }, [form, service, setValue, watchedValues]);

  const addResponseMutation = useMutation({
    mutationFn: (data: Record<string, any>) => {
        if (!serviceId) throw new Error("Service ID is required.");
        const payload = { ...data, _totalPrice: totalPrice };
        return addFormResponse(serviceId, params.formId, payload);
    },
    onSuccess: () => {
      setFormSubmitted(true);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Could not submit your response. Please try again.',
      });
    },
  });

  const onSubmit = (data: Record<string, any>) => {
    addResponseMutation.mutate(data);
  };

  if (!serviceId) {
     return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-destructive">
            Missing Service ID
          </h2>
          <p>This form can't be loaded without a service ID in the URL.</p>
        </div>
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

  if (isError || !form) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-destructive">
            Form Not Found
          </h2>
          <p>This form does not exist or could not be loaded.</p>
        </div>
      </div>
    );
  }

  if (formSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center text-center bg-gray-50">
        <div className="bg-white p-10 rounded-lg shadow-md">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
        <div className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold">{form.name}</h1>
          <p className="mt-2 text-muted-foreground">{form.description}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {form.elements.map(element => (
            <div key={element.id}>
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
                {
                  {
                    'short-answer': (
                      <Input
                        {...register(element.id, {required: element.required})}
                        placeholder={element.placeholder}
                      />
                    ),
                    'long-answer': (
                      <Textarea
                        {...register(element.id, {required: element.required})}
                        placeholder={element.placeholder}
                      />
                    ),
                    'multiple-choice': (
                       <Controller
                        name={element.id}
                        control={control}
                        defaultValue={element.defaultValue}
                        rules={{ required: element.required }}
                        render={({ field }) => (
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <div className="space-y-2">
                              {element.options?.map(opt => (
                                <div
                                  key={opt.id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value={opt.value} id={opt.id} />
                                    <Label htmlFor={opt.id}>{getOptionLabel(opt)}</Label>
                                  </div>
                                  {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                      />
                    ),
                    checkboxes: (
                      <div className="space-y-2">
                        {element.options?.map(opt => (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={opt.id}
                                {...register(`${element.id}.${opt.id}`)}
                              />
                              <Label htmlFor={opt.id}>{getOptionLabel(opt)}</Label>
                            </div>
                             {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground font-medium">+QAR {opt.price}</span>}
                          </div>
                        ))}
                      </div>
                    ),
                    dropdown: (
                      <Controller
                        name={element.id}
                        control={control}
                        defaultValue={element.defaultValue}
                        rules={{ required: element.required }}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={element.placeholder || 'Select an option'} />
                            </SelectTrigger>
                            <SelectContent>
                              {element.options?.map(opt => (
                                <SelectItem key={opt.id} value={opt.value}>
                                  <div className="flex justify-between w-full">
                                    <span>{getOptionLabel(opt)}</span>
                                    {opt.price && opt.price > 0 && <span className="text-sm text-muted-foreground ml-4">+QAR {opt.price}</span>}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ),
                    stepper: (
                      <StepperInput 
                        options={element.options || []} 
                        control={control} 
                        elementId={element.id}
                        totalMin={element.totalMin}
                        totalMax={element.totalMax}
                        noTotalMax={element.noTotalMax}
                      />
                    ),
                    toggle: (
                      <Controller
                        name={element.id}
                        control={control}
                        defaultValue={element.defaultValue}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2">
                            {element.options?.map(opt => (
                              <Button
                                key={opt.id}
                                type="button"
                                variant={field.value === opt.value ? 'default' : 'outline'}
                                className="rounded-full"
                                onClick={() => field.onChange(opt.value)}
                              >
                                {getOptionLabel(opt)}{opt.price && opt.price > 0 ? ` (+QAR ${opt.price})` : ''}
                              </Button>
                            ))}
                          </div>
                        )}
                      />
                    ),
                    'rich-radio': (
                       <Controller
                        name={element.id}
                        control={control}
                        defaultValue={element.defaultValue}
                        rules={{ required: element.required }}
                        render={({ field }) => (
                          <div className="space-y-2">
                            {element.options?.map(opt => (
                              <div
                                key={opt.id}
                                className={cn(
                                  "flex items-center justify-between p-3 border rounded-md cursor-pointer",
                                  field.value === opt.value && 'border-primary bg-primary/5'
                                )}
                                onClick={() => field.onChange(opt.value)}
                              >
                                <div className='flex items-center gap-3'>
                                  <DynamicIcon iconName={opt.icon || 'Clock'} className="h-5 w-5 text-muted-foreground"/>
                                  <div>
                                    <p className="font-medium">{opt.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {opt.price && opt.price > 0 && <span className="text-sm font-bold text-primary">+QAR {opt.price}</span>}
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    field.value === opt.value ? 'border-primary' : 'border-muted-foreground'
                                  )}>
                                    {field.value === opt.value && <div className='w-2.5 h-2.5 rounded-full bg-primary'/>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                         )}
                        />
                    ),
                    accordion: (
                       <Accordion type="single" collapsible className="w-full">
                        {element.options?.map((opt) => (
                          <AccordionItem value={opt.id} key={opt.id}>
                            <AccordionTrigger>
                               <div className="flex items-center justify-between w-full">
                                 <div className="flex items-center gap-3">
                                   <DynamicIcon iconName={opt.icon || 'ShieldQuestion'} className="h-5 w-5 text-muted-foreground"/>
                                   {getOptionLabel(opt)}
                                 </div>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm text-muted-foreground pl-8">{opt.description}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )
                  }[element.type]
                }
              </div>
              {errors[element.id] && (
                <p className="text-sm text-destructive mt-2">
                  This field is required.
                </p>
              )}
            </div>
          ))}
          <Button type="submit" disabled={addResponseMutation.isPending} className="h-12 text-lg">
            {addResponseMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              `Pay QAR ${totalPrice}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}


    



