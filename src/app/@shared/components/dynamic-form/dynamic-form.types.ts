// Interfaces for form field configuration
export interface FormFieldOption {
  label: string;
  value: string | number;
}

export interface FormFieldValidation {
  regex?: string;
  message?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface FormField {
  type:
    | 'inputField'
    | 'textareaField'
    | 'DropDownField'
    | 'dropdownField'
    | 'checkboxField'
    | 'radioField'
    | 'fileField'
    | 'multiselectField';
  inputType?:
    | 'text'
    | 'email'
    | 'date'
    | 'datetime'
    | 'url'
    | 'number'
    | 'file'
    | 'address'
    | 'phone'
    | 'tel'
    | 'checkbox'
    | 'radio'
    | 'password';
  label: string;
  slug: string;
  required: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  allowMultipleSelection?: boolean;
  description?: string;
  optionLayout?: 'horizontal' | 'vertical';
  disabled?: boolean;
  defaultValue?: any;
  colSpan?: 1 | 2; // For grid layout - 1 = half width, 2 = full width
  accept?: string; // For file inputs - accepted file types
  rows?: number; // For textarea - number of rows
  toggleStyle?: boolean; // For checkbox fields - render as toggle switch instead of checkbox
}

export interface DynamicFormSubmitResult {
  name: string;
  slug: string;
  values: Record<string, any>;
  files?: Record<string, File>;
  isValid: boolean;
}
