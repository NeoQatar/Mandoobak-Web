import {
  Type,
  List,
  CheckSquare,
  ChevronDownSquare,
  MessageSquare,
  Minus,
  ToggleRight,
  ListTodo,
  ListCollapse,
} from 'lucide-react';
import type {FormElementType} from '@/types/forms';

interface FormElementInfo {
  type: FormElementType;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const AVAILABLE_FORM_ELEMENTS: FormElementInfo[] = [
  {
    type: 'short-answer',
    label: 'Short Answer',
    description: 'For brief text responses',
    icon: Type,
  },
  {
    type: 'long-answer',
    label: 'Long Answer',
    description: 'For detailed text responses',
    icon: MessageSquare,
  },
  {
    type: 'multiple-choice',
    label: 'Multiple Choice',
    description: 'A single choice from a list',
    icon: List,
  },
  {
    type: 'checkboxes',
    label: 'Checkboxes',
    description: 'Multiple choices from a list',
    icon: CheckSquare,
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    description: 'Select an option from a dropdown menu',
    icon: ChevronDownSquare,
  },
  {
    type: 'stepper',
    label: 'Number Stepper',
    description: 'For quantity selection',
    icon: Minus,
  },
  {
    type: 'toggle',
    label: 'Toggle Buttons',
    description: 'A stylish single-choice selector',
    icon: ToggleRight,
  },
  {
    type: 'rich-radio',
    label: 'Rich Radio Group',
    description: 'Radio with icon and description',
    icon: ListTodo,
  },
  {
    type: 'accordion',
    label: 'Accordion',
    description: 'For structured, collapsible content',
    icon: ListCollapse,
  },
];
