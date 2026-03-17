import { Component, OnInit, forwardRef, signal, computed, effect, untracked, inject, input, output, ElementRef, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Support different option formats
export type MultiselectOption = string | number | MultiselectOptionObject;
export interface MultiselectOptionObject {
    id: string | number;
    label?: string;
    name?: string;
    value?: any;
    disabled?: boolean;
}

// Normalized option interface for internal use
interface NormalizedOption {
    id: string | number;
    label: string;
    value: any;
    disabled: boolean;
    original: MultiselectOption;
}

@Component({
    selector: 'multiselect',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiselectComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MultiselectComponent),
            multi: true
        }
    ],
    templateUrl: './multiselect.component.html',
    styleUrl: './multiselect.component.css'
})
export class MultiselectComponent implements ControlValueAccessor, Validator, OnInit {
    private readonly elementRef = inject(ElementRef);
    id = signal<number>(1);
    // Modern Angular 19 inputs
    options = input<MultiselectOption[]>([]);
    placeholder = input<string>('Select options...');
    disabled = input<boolean>(false);
    allowCustomText = input<boolean>(true);
    customTextPlaceholder = input<string>('Type to add custom items...');
    maxSelections = input<number>(-1); // -1 means no limit
    showChips = input<boolean>(true);
    chipClass = input<string>('');
    dropdownClass = input<string>('');
    inputClass = input<string>('');
    allowCommaSeparated = input<boolean>(true);

    // Validation inputs
    required = input<boolean>(false);
    requiredMessage = input<string>('This field is required');
    minSelections = input<number>(0);
    minSelectionsMessage = input<string>('Please select at least {min} options');
    maxSelectionsMessage = input<string>('You can select maximum {max} options');
    forceInvalid = input<boolean>(false);

    // Modern Angular 19 outputs
    selectionChange = output<any[]>();
    customTextAdded = output<string>();
    dropdownToggle = output<boolean>();

    // Signals
    selectedValues = signal<any[]>([]);
    customTexts = signal<string[]>([]);
    isOpen = signal<boolean>(false);
    currentInputText = signal<string>('');
    isTouched = signal<boolean>(false);
    currentErrors = signal<ValidationErrors | null>(null);
    isInputFocused = signal<boolean>(false);

    // Computed signals
    normalizedOptions = computed(() => {
        return this.options().map(option => this.normalizeOption(option));
    });

    allSelectedItems = computed(() => {
        const selected = this.selectedValues().map(value => {
            const option = this.normalizedOptions().find(opt => opt.value === value);
            return {
                id: option?.id || value,
                label: option?.label || String(value),
                value: value,
                isCustom: false
            };
        });

        const custom = this.customTexts().map(text => ({
            id: `custom-${text}`,
            label: text,
            value: text,
            isCustom: true
        }));

        return [...selected, ...custom];
    });

    filteredOptions = computed(() => {
        const searchText = this.currentInputText().toLowerCase().trim();
        let filtered = this.normalizedOptions();

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(option =>
                option.label.toLowerCase().includes(searchText)
            );
        }

        // Remove already selected options
        filtered = filtered.filter(option =>
            !this.selectedValues().includes(option.value) &&
            !this.customTexts().includes(option.label)
        );

        return filtered;
    });

    isInvalid = computed(() => {
        const errors = this.currentErrors();
        const isTouched = this.isTouched();
        const isForceInvalid = this.forceInvalid();

        // Show error if:
        // 1. Field is touched AND has errors, OR
        // 2. Force invalid is true AND has errors
        return (isTouched && errors !== null) || (isForceInvalid && errors !== null);
    });

    hasError = computed(() => {
        return this.isInvalid();
    });

    errorMessage = computed(() => {
        const errors = this.currentErrors();
        if (!errors) return '';

        if (errors['required']) {
            return this.requiredMessage();
        }
        if (errors['minSelections']) {
            return this.minSelectionsMessage().replace('{min}', this.minSelections().toString());
        }
        if (errors['maxSelections']) {
            return this.maxSelectionsMessage().replace('{max}', this.maxSelections().toString());
        }

        return '';
    });

    canAddMore = computed(() => {
        const max = this.maxSelections();
        if (max === -1) return true;
        return this.allSelectedItems().length < max;
    });

    // ControlValueAccessor
    private onChange = (value: any[]) => { };
    private onTouched = () => { };
    private onValidatorChange = () => { };
    private isInitialized = false;
    constructor() {
        // Effect to notify parent of changes (for form control binding)
        effect(() => {
            // Skip the initial run if not initialized to prevent infinite loops
            if (!this.isInitialized) {
                this.isInitialized = true;
                return;
            }

            // Read the signal value within the effect
            const values = this.allSelectedItems().map(item => item.value);

            // Use untracked for side effects that don't need to be tracked
            untracked(() => {
                // Always call onChange to update the form control
                this.onChange(values);
                // Emit selectionChange for any additional listeners
                this.selectionChange.emit(values);

                // Mark as touched when values change
                if (values.length > 0) {
                    this.isTouched.set(true);
                    this.onTouched();
                }

                // Validate immediately when values change
                const errors = this.validateValue(values);
                this.currentErrors.set(errors);
                this.onValidatorChange();
            });
        });
    }
    ngOnInit() {
        this.id.set(Math.random() * 1000000);
    }


    getInputPlaceholder(): string {
        if (this.allSelectedItems().length === 0) {
            return this.placeholder();
        }
        return this.allowCustomText() ? this.customTextPlaceholder() : '';
    }

    focusMainInput(): void {
        if (this.disabled()) return;

        const input = this.elementRef.nativeElement.querySelector('input');
        if (input) {
            input.focus();
        }

        if (!this.isOpen()) {
            this.toggleDropdown();
        }
    }

    onMainInputFocus(): void {
        this.isInputFocused.set(true);
        if (!this.isOpen()) {
            this.toggleDropdown();
        }
    }

    onMainInputBlur(): void {
        this.isInputFocused.set(false);
        this.isTouched.set(true);
        this.onTouched();

        // Delay closing to allow for option clicks
        setTimeout(() => {
            if (!this.isInputFocused()) {
                this.processCurrentInput();
                this.isOpen.set(false);
            }
        }, 200);
    }

    onMainInputChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.currentInputText.set(target.value);

        if (!this.isOpen()) {
            this.isOpen.set(true);
        }
    }

    onMainInputKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.processCurrentInput();
                break;
            case 'Escape':
                event.preventDefault();
                this.currentInputText.set('');
                this.isOpen.set(false);
                break;
            case 'Backspace':
                if (this.currentInputText() === '' && this.allSelectedItems().length > 0) {
                    event.preventDefault();
                    this.removeLastItem();
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen()) {
                    this.isOpen.set(true);
                }
                break;
        }
    }

    processCurrentInput(): void {
        const inputText = this.currentInputText().trim();
        if (!inputText || !this.allowCustomText() || !this.canAddMore()) return;

        if (this.allowCommaSeparated()) {
            this.processCommaSeparatedInput(inputText);
        } else {
            this.addSingleItem(inputText);
        }

        this.currentInputText.set('');
    }

    processCommaSeparatedInput(text: string): void {
        const items = text.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .filter(item => !this.isDuplicate(item));

        items.forEach(item => {
            if (this.canAddMore()) {
                this.addSingleItem(item);
            }
        });
    }

    addSingleItem(text: string): void {
        if (!text || this.isDuplicate(text) || !this.canAddMore()) return;

        // Check if it matches an existing option
        const matchingOption = this.normalizedOptions().find(opt =>
            opt.label.toLowerCase() === text.toLowerCase()
        );

        if (matchingOption) {
            this.selectedValues.set([...this.selectedValues(), matchingOption.value]);
        } else if (this.allowCustomText()) {
            this.customTexts.set([...this.customTexts(), text]);
            this.customTextAdded.emit(text);
        }

        this.isTouched.set(true);

        // Manually trigger onChange to ensure form control is updated
        const newValues = this.allSelectedItems().map(item => item.value);
        this.onChange(newValues);
    }

    removeLastItem(): void {
        const items = this.allSelectedItems();
        if (items.length === 0) return;

        const lastItem = items.at(-1);
        if (lastItem) {
            this.removeItem(lastItem);
        }
    }

    isDuplicate(text: string): boolean {
        const normalizedText = text.toLowerCase().trim();
        return this.customTexts().some(existing => existing.toLowerCase().trim() === normalizedText) ||
            this.normalizedOptions().some(option => option.label.toLowerCase().trim() === normalizedText) ||
            this.selectedValues().some(value => String(value).toLowerCase().trim() === normalizedText);
    }

    normalizeOption(option: MultiselectOption): NormalizedOption {
        if (typeof option === 'string' || typeof option === 'number') {
            return {
                id: option,
                label: String(option),
                value: option,
                disabled: false,
                original: option
            };
        }

        if (typeof option === 'object' && option !== null) {
            const obj = option as MultiselectOptionObject;
            return {
                id: obj.id,
                label: obj.label || obj.name || String(obj.id),
                value: obj.value ?? obj.id,
                disabled: obj.disabled || false,
                original: option
            };
        }

        return {
            id: String(option),
            label: String(option),
            value: option,
            disabled: false,
            original: option
        };
    }

    // ControlValueAccessor implementation
    writeValue(value: any): void {
        if (value === null || value === undefined) {
            this.selectedValues.set([]);
            this.customTexts.set([]);
            return;
        }

        // Convert value to array if it's not already
        const valueArray = Array.isArray(value) ? value : [value];

        // Split into selected values and custom texts
        const selected: any[] = [];
        const custom: string[] = [];

        valueArray.forEach(val => {
            // If val is already a string, treat as custom text
            if (typeof val === 'string') {
                custom.push(val);
            }
            // If val has skillName property (from API)
            else if (typeof val === 'object' && val.skillName) {
                custom.push(val.skillName);
            }
            // If val is an object with name/label
            else if (typeof val === 'object' && (val.name || val.label)) {
                custom.push(val.name || val.label);
            }
            // Default case - convert to string and add as custom
            else {
                custom.push(String(val));
            }
        });

        this.selectedValues.set(selected);
        this.customTexts.set(custom);
    }

    registerOnChange(fn: (value: any[]) => void): void {
        this.onChange = (value: any[]) => {
            fn(value);
        };
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = () => {
            fn();
            this.isTouched.set(true);
        };
    }

    setDisabledState(isDisabled: boolean): void {
        // Handle disabled state if needed
    }

    // Validator implementation
    validate(control: AbstractControl): ValidationErrors | null {
        // Always validate if forceInvalid is true
        if (this.forceInvalid()) {
            return this.validateValue(control.value);
        }

        // Otherwise, validate only if touched
        if (this.isTouched()) {
            return this.validateValue(control.value);
        }

        return null;
    }

    registerOnValidatorChange(fn: () => void): void {
        this.onValidatorChange = fn;
    }

    private validateValue(value: any[]): ValidationErrors | null {
        if (!Array.isArray(value)) {
            value = [];
        }

        const totalSelected = value.length;
        const errors: ValidationErrors = {};

        // Required validation - always check if required
        if (this.required() && totalSelected === 0) {
            errors['required'] = true;
        }

        // Min selections validation
        if (this.minSelections() > 0 && totalSelected < this.minSelections()) {
            errors['minSelections'] = {
                min: this.minSelections(),
                actual: totalSelected
            };
        }

        // Max selections validation
        if (this.maxSelections() > 0 && totalSelected > this.maxSelections()) {
            errors['maxSelections'] = {
                max: this.maxSelections(),
                actual: totalSelected
            };
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    // TrackBy functions
    trackByOption(index: number, option: NormalizedOption): string | number {
        return option.id;
    }

    trackByItem(index: number, item: any): string | number {
        return item.id;
    }

    // Component methods
    toggleDropdown(): void {
        if (this.disabled()) return;

        const newState = !this.isOpen();
        this.isOpen.set(newState);
        this.dropdownToggle.emit(newState);

        if (!newState) {
            this.processCurrentInput();
        }
    }

    onOptionClick(option: NormalizedOption): void {
        if (option.disabled || !this.canAddMore()) {
            return;
        }

        // Mark as touched since user interacted with the component
        this.isTouched.set(true);
        this.onTouched();

        // Add the option's value to selected values
        const currentValues = this.selectedValues();
        const newValues = [...currentValues, option.value];
        this.selectedValues.set(newValues);

        // Clear input text
        this.currentInputText.set('');

        // Manually trigger onChange to ensure form control is updated
        const allValues = [...newValues, ...this.customTexts()];
        this.onChange(allValues);

        // Focus back on the input
        setTimeout(() => this.focusMainInput(), 0);

        // Close dropdown if max selections reached
        if (!this.canAddMore()) {
            this.isOpen.set(false);
        }
    }

    removeItem(item: any): void {
        if (this.disabled()) return;

        if (item.isCustom) {
            // Remove from custom texts
            this.customTexts.set(this.customTexts().filter(text => text !== item.value));
        } else {
            // Remove from selected values
            this.selectedValues.set(this.selectedValues().filter(value => value !== item.value));
        }

        // Mark as touched
        this.onTouched();

        // Manually trigger onChange to ensure form control is updated
        const newValues = this.allSelectedItems().map(item => item.value);
        this.onChange(newValues);
    }

    isOptionSelected(option: NormalizedOption): boolean {
        return this.selectedValues().includes(option.value);
    }

    // Host listener to close dropdown when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            if (this.isOpen()) {
                this.processCurrentInput();
                this.isOpen.set(false);
            }
        }
    }
} 