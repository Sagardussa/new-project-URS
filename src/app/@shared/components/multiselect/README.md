# Multiselect Component

A modern, reusable Angular component that provides a multi-select dropdown with checkbox functionality, chip display, and custom text input capabilities. Built with Angular 18+ signals and supports multiple option formats.

## Features

- ✅ **Multi-select with checkboxes** - Select multiple options with visual checkboxes
- ✅ **Chip display** - Selected items displayed as removable chips
- ✅ **Custom text input** - Add custom text beyond pre-existing options
- ✅ **Direct input mode** - Type directly in the input field for quick entry
- ✅ **Comma-separated values** - Add multiple items at once with comma separation
- ✅ **Duplicate prevention** - Automatically prevents duplicate entries
- ✅ **Multiple option formats** - Support for strings, numbers, and objects
- ✅ **Search functionality** - Filter options by typing
- ✅ **Form integration** - Works with both `FormControlName` and `ngModel`
- ✅ **Validation support** - Built-in validation with custom messages
- ✅ **Responsive design** - Mobile-friendly with touch support
- ✅ **Accessibility** - Keyboard navigation and screen reader support
- ✅ **Dark mode** - Automatic dark mode detection
- ✅ **Customizable styling** - Extensive CSS customization options
- ✅ **Angular 18+ signals** - Modern reactive programming with signals

## Supported Option Formats

The component supports multiple option formats for maximum flexibility:

### 1. Simple Arrays (Strings/Numbers)

```typescript
// String array
options: string[] = ['Ramesh', 'Shyam', 'John', 'Jane'];

// Number array
options: number[] = [1, 2, 3, 4, 5];
```

### 2. Objects with id and label

```typescript
options: MultiselectOption[] = [
  { id: 1, label: 'JavaScript', value: 'javascript' },
  { id: 2, label: 'TypeScript', value: 'typescript' },
  { id: 3, label: 'Angular', value: 'angular' }
];
```

### 3. Objects with id and name

```typescript
options: MultiselectOption[] = [
  { id: 1, name: 'Docker', value: 'docker' },
  { id: 2, name: 'Kubernetes', value: 'kubernetes' },
  { id: 3, name: 'AWS', value: 'aws' }
];
```

### 4. Mixed Arrays

```typescript
options: MultiselectOption[] = [
  'Simple String',
  { id: 1, label: 'Object with label' },
  { id: 2, name: 'Object with name' },
  { id: 3, label: 'Custom value', value: 'custom-value' }
];
```

## Installation

The component is part of the `common-library` package. Make sure the library is properly imported in your project.

## Basic Usage

### 1. Simple String Array

```typescript
import { Component } from "@angular/core";
import { MultiselectComponent } from "common-library";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [MultiselectComponent],
  template: `
    <label>Select Names:</label>
    <multiselect [(ngModel)]="selectedNames" [options]="nameOptions" placeholder="Select names..." [allowCustomText]="true" [maxSelections]="5"> </multiselect>
  `,
})
export class ExampleComponent {
  selectedNames: string[] = [];
  nameOptions: string[] = ["Ramesh", "Shyam", "John", "Jane"];
}
```

### 2. Objects with id and label

```typescript
import { Component } from "@angular/core";
import { MultiselectComponent, MultiselectOption } from "common-library";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [MultiselectComponent],
  template: `
    <label>Select Skills:</label>
    <multiselect [(ngModel)]="selectedSkills" [options]="skillOptions" placeholder="Select skills..." [allowCustomText]="true" [maxSelections]="3"> </multiselect>
  `,
})
export class ExampleComponent {
  selectedSkills: any[] = [];

  skillOptions: MultiselectOption[] = [
    { id: 1, label: "JavaScript", value: "javascript" },
    { id: 2, label: "TypeScript", value: "typescript" },
    { id: 3, label: "Angular", value: "angular" },
  ];
}
```

### 3. Objects with id and name

```typescript
import { Component } from "@angular/core";
import { MultiselectComponent, MultiselectOption } from "common-library";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [MultiselectComponent],
  template: `
    <label>Select Technologies:</label>
    <multiselect [(ngModel)]="selectedTechnologies" [options]="techOptions" placeholder="Select technologies..." [allowCustomText]="false" [maxSelections]="4"> </multiselect>
  `,
})
export class ExampleComponent {
  selectedTechnologies: any[] = [];

  techOptions: MultiselectOption[] = [
    { id: 1, name: "Docker", value: "docker" },
    { id: 2, name: "Kubernetes", value: "kubernetes" },
    { id: 3, name: "AWS", value: "aws" },
  ];
}
```

### 4. Reactive Forms

```typescript
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MultiselectComponent, MultiselectOption } from "common-library";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [MultiselectComponent],
  template: `
    <form [formGroup]="form">
      <label>Select Skills:</label>
      <multiselect formControlName="skills" [options]="skillOptions" [required]="true" [maxSelections]="5"> </multiselect>
    </form>
  `,
})
export class ExampleComponent {
  form: FormGroup;

  skillOptions: MultiselectOption[] = [
    { id: 1, label: "JavaScript", value: "javascript" },
    { id: 2, label: "TypeScript", value: "typescript" },
    { id: 3, label: "Angular", value: "angular" },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      skills: [[], [Validators.required]],
    });
  }
}
```

## API Reference

### Inputs

| Property                | Type                  | Default                                  | Description                                            |
| ----------------------- | --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `options`               | `MultiselectOption[]` | `[]`                                     | Array of available options (supports multiple formats) |
| `placeholder`           | `string`              | `'Select options...'`                    | Placeholder text when no items selected                |
| `disabled`              | `boolean`             | `false`                                  | Whether the dropdown is disabled                       |
| `allowCustomText`       | `boolean`             | `true`                                   | Allow adding custom text beyond options                |
| `customTextPlaceholder` | `string`              | `'Add custom text...'`                   | Placeholder for custom text input                      |
| `maxSelections`         | `number`              | `-1`                                     | Maximum number of selections (-1 = no limit)           |
| `minSelections`         | `number`              | `0`                                      | Minimum number of selections required                  |
| `showChips`             | `boolean`             | `true`                                   | Show selected items as chips                           |
| `chipClass`             | `string`              | `''`                                     | CSS class for chips                                    |
| `dropdownClass`         | `string`              | `''`                                     | CSS class for dropdown menu                            |
| `inputClass`            | `string`              | `''`                                     | CSS class for input field                              |
| `required`              | `boolean`             | `false`                                  | Whether the field is required                          |
| `requiredMessage`       | `string`              | `'This field is required'`               | Error message for required validation                  |
| `minSelectionsMessage`  | `string`              | `'Please select at least {min} options'` | Error message for min selections                       |
| `maxSelectionsMessage`  | `string`              | `'You can select maximum {max} options'` | Error message for max selections                       |
| `forceInvalid`          | `boolean`             | `false`                                  | Force invalid state for external validation            |

### Outputs

| Event             | Type      | Description                        |
| ----------------- | --------- | ---------------------------------- |
| `selectionChange` | `any[]`   | Emitted when selection changes     |
| `customTextAdded` | `string`  | Emitted when custom text is added  |
| `dropdownToggle`  | `boolean` | Emitted when dropdown opens/closes |

### Interfaces

```typescript
// Support different option formats
export type MultiselectOption = string | number | MultiselectOptionObject;

export interface MultiselectOptionObject {
  id: string | number;
  label?: string;
  name?: string;
  value?: any;
  disabled?: boolean;
}
```

## New Features

### Direct Input Mode

You can now type directly in the input field for quick entry:

```typescript
<multiselect
  [(ngModel)]="selection"
  [options]="options"
  [allowDirectInput]="true"
  [allowCommaSeparated]="true"
  customTextPlaceholder="Type items separated by commas...">
</multiselect>
```

**How it works:**

- Press **Tab** to switch between dropdown mode and direct input mode
- Type items directly in the input field
- Press **Enter** to add the current text as a custom item
- Press **Escape** to cancel and return to dropdown mode

### Comma-Separated Values

Add multiple items at once by typing comma-separated values:

```typescript
// Type: "item1, item2, item3" and press Enter
// This will create 3 separate chips
```

### Duplicate Prevention

The component automatically prevents duplicate entries:

- Case-insensitive duplicate detection
- Works for both predefined options and custom text
- Prevents adding items that already exist

## Advanced Examples

### Mixed Array with Different Formats

```typescript
const mixedOptions: MultiselectOption[] = ["Simple String", "Another String", { id: 1, label: "Object with label" }, { id: 2, name: "Object with name" }, { id: 3, label: "Object with custom value", value: "custom-value" }, "More strings", { id: 4, name: "Another object", disabled: true }];
```

### Objects with Custom Value Property

```typescript
const countryOptions: MultiselectOption[] = [
  { id: 1, label: "United States", value: "US" },
  { id: 2, label: "United Kingdom", value: "UK" },
  { id: 3, label: "Canada", value: "CA" },
  { id: 4, label: "Australia", value: "AU" },
];
```

### With Validation and Custom Messages

```typescript
<multiselect
  formControlName="skills"
  [options]="skillOptions"
  [required]="true"
  [minSelections]="2"
  [maxSelections]="5"
  requiredMessage="Please select at least one skill"
  minSelectionsMessage="Please select at least {min} skills"
  maxSelectionsMessage="You can select maximum {max} skills">
</multiselect>
```

### Custom Styling

```typescript
<multiselect
  [(ngModel)]="selection"
  [options]="options"
  chipClass="custom-chip"
  dropdownClass="custom-dropdown"
  inputClass="custom-input">
</multiselect>
```

## Styling

The component uses CSS custom properties and can be easily customized. Key CSS classes:

- `.multiselect-container` - Main container
- `.dropdown-trigger` - Clickable trigger area
- `.chip` - Individual chip elements
- `.dropdown-menu` - Dropdown menu
- `.option-item` - Individual option items
- `.custom-text-input` - Custom text input field

### Custom CSS Example

```css
/* Custom chip styling */
.custom-chip {
  background-color: #fef3c7 !important;
  color: #92400e !important;
  border: 1px solid #f59e0b !important;
}

/* Custom dropdown styling */
.custom-dropdown {
  border-color: #f59e0b !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

/* Custom input styling */
.custom-input {
  color: #92400e !important;
  font-weight: 600 !important;
}
```

## Accessibility

The component includes:

- Keyboard navigation (Arrow keys, Enter, Escape)
- Screen reader support with proper ARIA labels
- Focus management
- High contrast support
- Touch-friendly interactions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- Angular 18+
- No external dependencies

## Contributing

When contributing to this component:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure accessibility compliance
5. Test across different browsers

## License

This component is part of the common-library package and follows the same license terms.
