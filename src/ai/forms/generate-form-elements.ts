'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {FormElement, FormElementOption} from '@/types/forms';

const GenerateFormElementsInputSchema = z.object({
  formPurpose: z.string().describe('The purpose of the form to be created.'),
});

const FormElementOptionSchema = z.object({
  value: z.string().describe('The text displayed for this option.'),
});

const FormElementSchema = z.object({
  type: z
    .enum([
      'short-answer',
      'long-answer',
      'multiple-choice',
      'checkboxes',
      'dropdown',
      'stepper',
      'toggle',
      'rich-radio',
    ])
    .describe('The type of the form element.'),
  label: z.string().describe('The main question or label for the form element.'),
  placeholder: z
    .string()
    .optional()
    .describe('Placeholder text for input fields.'),
  helpText: z.string().optional().describe('Additional help text or description.'),
  required: z.boolean().describe('Whether the element is required.'),
  options: z
    .array(FormElementOptionSchema)
    .optional()
    .describe('A list of options for choice-based elements.'),
});

const GenerateFormElementsOutputSchema = z.object({
  elements: z.array(FormElementSchema),
});

export async function generateFormElements(
  input: z.infer<typeof GenerateFormElementsInputSchema>
): Promise<z.infer<typeof GenerateFormElementsOutputSchema>> {
  const prompt = ai.definePrompt({
    name: 'generateFormElementsPrompt',
    input: {schema: GenerateFormElementsInputSchema},
    output: {schema: GenerateFormElementsOutputSchema},
    prompt: `You are an expert at creating effective and user-friendly forms. Based on the provided form purpose, generate a list of relevant form elements (questions).

Form Purpose: {{{formPurpose}}}

Generate a variety of question types that make sense for the purpose. Available types are: 'short-answer', 'long-answer', 'multiple-choice', 'checkboxes', 'dropdown', 'stepper', 'toggle', 'rich-radio'.
For multiple-choice, checkbox, dropdown, toggle, or rich-radio questions, provide at least 2-3 sensible options.
For 'stepper' questions, you can provide options like 'Adults', 'Children' if relevant.
For 'rich-radio', the options can be more descriptive.
Keep labels concise and clear. Use placeholder and help text where it adds value.
Make reasonable assumptions about which fields should be required.
Do not include a submit button.
Return a structured list of form elements.`,
  });

  const {output} = await prompt(input);
  return output!;
}
