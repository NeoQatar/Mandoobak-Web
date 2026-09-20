
export type FormElementType =
  | 'short-answer'
  | 'long-answer'
  | 'multiple-choice'
  | 'checkboxes'
  | 'dropdown'
  | 'stepper'
  | 'toggle'
  | 'rich-radio'
  | 'accordion';

export interface FormElementOption {
  id: string;
  value: string;
  icon?: string;
  description?: string;
  min?: number;
  max?: number;
  price?: number;
}

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: FormElementOption[];
  totalMin?: number;
  totalMax?: number;
  noTotalMax?: boolean;
  defaultValue?: string;
}

export interface Form {
  id?: string;
  serviceId?: string; // To link back to the service
  name: string;
  description: string;
  elements: FormElement[];
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  order?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string; // ISO Date String
  data: Record<string, any>;
}
