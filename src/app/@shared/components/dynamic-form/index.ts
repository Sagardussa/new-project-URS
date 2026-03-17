export { DynamicFormComponent } from './dynamic-form.component';
export type {
  FormField,
  FormFieldOption,
  FormFieldValidation,
  DynamicFormSubmitResult,
} from './dynamic-form.types';

/** Alias for components that expect a simpler field type name. */
export type DynamicFormField = import('./dynamic-form.types').FormField;
