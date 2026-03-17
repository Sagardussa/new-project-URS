# International Phone Input Component

A comprehensive and reusable international phone input component for Angular applications.

## Features

- 📱 International phone number input with country selection
- 🔍 Searchable country dropdown
- 🎨 Modern and accessible UI design
- 🌓 Dark mode support
- 📝 Form validation support (ControlValueAccessor)
- ♿ ARIA accessibility features
- 📱 Mobile responsive
- 🚀 Standalone component (Angular 14+)

## Installation

The component is available as part of the common-library. Make sure to import `CommonLibraryModule` in your application.

```typescript
import { CommonLibraryModule } from "common-library";

@NgModule({
  imports: [
    CommonLibraryModule.forRoot(environment),
    // ... other imports
  ],
})
export class AppModule {}
```

## Basic Usage

### Template-driven Forms

```html
<lib-intl-phone-input labelText="Phone Number" placeholder="Enter your phone number" [(ngModel)]="phoneNumber" (phoneNumberChange)="onPhoneChange($event)" (countryChange)="onCountryChange($event)"> </lib-intl-phone-input>
```

### Reactive Forms

```html
<lib-intl-phone-input labelText="Contact Number" placeholder="Enter phone number" formControlName="phoneNumber" [required]="true" [showError]="phoneForm.get('phoneNumber')?.invalid && phoneForm.get('phoneNumber')?.touched" errorMessage="Please enter a valid phone number"> </lib-intl-phone-input>
```

```typescript
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class MyComponent {
  phoneForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.phoneForm = this.fb.group({
      phoneNumber: ["", [Validators.required]],
    });
  }
}
```

## Configuration Options

### Input Properties

| Property             | Type     | Default              | Description                                |
| -------------------- | -------- | -------------------- | ------------------------------------------ |
| `placeholder`        | string   | 'Enter phone number' | Input field placeholder text               |
| `disabled`           | boolean  | false                | Disable the input                          |
| `required`           | boolean  | false                | Mark field as required                     |
| `defaultCountry`     | string   | 'US'                 | Default selected country code              |
| `onlyCountries`      | string[] | []                   | Limit available countries (country codes)  |
| `preferredCountries` | string[] | []                   | Show preferred countries at top            |
| `searchPlaceholder`  | string   | 'Search country'     | Search input placeholder                   |
| `enableSearch`       | boolean  | true                 | Enable country search functionality        |
| `separateDialCode`   | boolean  | false                | Show dial code separately from phone input |
| `cssClass`           | string   | ''                   | Additional CSS classes                     |
| `labelText`          | string   | ''                   | Label text for the input                   |
| `errorMessage`       | string   | ''                   | Error message to display                   |
| `showError`          | boolean  | false                | Show error state                           |

### Output Events

| Event               | Type    | Description                                         |
| ------------------- | ------- | --------------------------------------------------- |
| `countryChange`     | Country | Emitted when country selection changes              |
| `phoneNumberChange` | string  | Emitted when phone number changes                   |
| `fullPhoneNumber`   | string  | Emitted with full phone number (dial code + number) |

## Advanced Usage Examples

### Limit Available Countries

```html
<lib-intl-phone-input labelText="Business Phone" [onlyCountries]="['US', 'CA', 'GB', 'AU']" placeholder="Enter business number"> </lib-intl-phone-input>
```

### Preferred Countries

```html
<lib-intl-phone-input labelText="Contact Number" [preferredCountries]="['US', 'IN', 'GB']" defaultCountry="IN"> </lib-intl-phone-input>
```

### Separate Dial Code Display

```html
<lib-intl-phone-input labelText="Phone Number" [separateDialCode]="true" placeholder="Enter number without country code"> </lib-intl-phone-input>
```

### Custom Styling

```html
<lib-intl-phone-input labelText="Phone" cssClass="custom-phone-input" placeholder="Your phone number"> </lib-intl-phone-input>
```

```css
.custom-phone-input .phone-input-wrapper {
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

.custom-phone-input .phone-input-wrapper:focus-within {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
```

### With Form Validation

```typescript
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-contact-form",
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
      <lib-intl-phone-input labelText="Phone Number *" placeholder="Enter your phone number" formControlName="phone" [required]="true" [showError]="isFieldInvalid('phone')" [errorMessage]="getErrorMessage('phone')" (fullPhoneNumber)="onPhoneNumberChange($event)"> </lib-intl-phone-input>

      <button type="submit" [disabled]="contactForm.invalid">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  contactForm: FormGroup;
  fullPhoneNumber: string = "";

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      phone: ["", [Validators.required, Validators.minLength(10)]],
    });
  }

  onPhoneNumberChange(fullNumber: string) {
    this.fullPhoneNumber = fullNumber;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors?.["required"]) {
      return "Phone number is required";
    }
    if (field?.errors?.["minlength"]) {
      return "Phone number must be at least 10 digits";
    }
    return "";
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log("Form submitted:", {
        phone: this.contactForm.value.phone,
        fullPhone: this.fullPhoneNumber,
      });
    }
  }
}
```

## Accessibility Features

The component includes several accessibility features:

- ARIA labels and roles for screen readers
- Keyboard navigation support
- Focus management
- High contrast mode support
- Screen reader announcements for country selection

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Styling and Theming

The component supports both light and dark themes automatically based on system preferences. You can also customize the appearance using CSS custom properties or by overriding the component's CSS classes.

## Country Data

The component includes 40+ commonly used countries with their respective dial codes and flag emojis. The list includes major countries from all continents and can be customized using the `onlyCountries` and `preferredCountries` properties.
