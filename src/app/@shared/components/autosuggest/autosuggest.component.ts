import { Component, OnInit, OnDestroy, AfterViewInit, forwardRef, signal, computed, inject, ElementRef, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'autosuggest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutosuggestComponent),
      multi: true
    }
  ],
  templateUrl: './autosuggest.component.html',
  styleUrl: './autosuggest.component.css'
})
export class AutosuggestComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private pendingValue: string | null = null;

  // Inputs
  @Input() data: string[] = [];
  @Input() suggestions: string[] = [];
  @Input() placeholder: string = 'Type to search...';
  @Input() allowCustomValue: boolean = true;
  @Input() minSearchLength: number = 2;
  @Input() debounceMs: number = 300;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  // Outputs
  @Output() valueSelected = new EventEmitter<string>();
  @Output() customValueSelected = new EventEmitter<string>();
  @Output() valueCleared = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  // Signals
  inputValue = signal<string>('');
  showDropdown = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  selectedIndex = signal<number>(-1);
  isFocused = signal<boolean>(false);

  // Computed
  get filteredSuggestions(): string[] {
    const input = this.inputValue().toLowerCase().trim();
    // Combine data (static) and suggestions (API) - suggestions first for priority
    const allSuggestions = [...this.suggestions, ...this.data];
    // Deduplicate (case-insensitive)
    const uniqueSuggestions = Array.from(new Set(
      allSuggestions.map(s => s.toLowerCase())
    )).map(lower => {
      // Find original case from suggestions first, then data
      return this.suggestions.find(s => s.toLowerCase() === lower) ||
             this.data.find(s => s.toLowerCase() === lower) ||
             lower;
    });
    
    // Show all when focused but not typing
    if (this.showDropdown() && !this.isTyping()) {
      return uniqueSuggestions;
    }
    
    // If input is empty or less than minSearchLength, show all
    if (input.length === 0 || input.length < this.minSearchLength) {
      return uniqueSuggestions;
    }
    
    // Filter when typing (min 2 chars)
    if (input.length >= this.minSearchLength) {
      const filtered = uniqueSuggestions.filter((suggestion: string) =>
        suggestion.toLowerCase().includes(input)
      );
      // If current input value matches a suggestion exactly (case-insensitive), include it
      const exactMatch = uniqueSuggestions.find((s: string) => s.toLowerCase() === input);
      if (exactMatch && !filtered.includes(exactMatch)) {
        return [exactMatch, ...filtered];
      }
      return filtered;
    }
    
    return uniqueSuggestions;
  }

  get hasCustomValue(): boolean {
    const input = this.inputValue().trim();
    if (!input || input.length < this.minSearchLength) {
      return false;
    }
    const filtered = this.filteredSuggestions;
    return !filtered.some((s: string) => s.toLowerCase() === input.toLowerCase());
  }

  // ControlValueAccessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement>;

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(this.debounceMs),
        takeUntil(this.destroy$)
      )
      .subscribe((term: string) => {
        this.isTyping.set(false);
        // Emit search event for parent to handle API calls
        this.search.emit(term);
      });
  }

  ngAfterViewInit(): void {
    // If there's a pending value from writeValue (called before view init), set it now
    if (this.pendingValue !== null) {
      this.setInputValue(this.pendingValue);
      this.pendingValue = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value === null || value === undefined) {
      this.setInputValue('');
      return;
    }
    const stringValue = String(value);
    this.setInputValue(stringValue);
  }

  private setInputValue(value: string): void {
    this.inputValue.set(value);
    // Update input element directly if available
    if (this.inputElement?.nativeElement) {
      this.inputElement.nativeElement.value = value;
      this.cdr.detectChanges();
    } else {
      // Store value to set after view init
      this.pendingValue = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }

  // Event handlers
  onFocus(): void {
    this.isFocused.set(true);
    // Always show dropdown on focus if there's data or if input has a value
    if (this.data.length > 0 || this.suggestions.length > 0 || this.inputValue().trim().length > 0) {
      this.showDropdown.set(true);
      this.isTyping.set(false); // Reset typing state to show all suggestions
      this.cdr.detectChanges();
    }
    this.onTouched();
  }

  onBlur(): void {
    this.isFocused.set(false);
    // Delay hiding dropdown to allow click events
    setTimeout(() => {
      if (!this.isFocused()) {
        this.showDropdown.set(false);
      }
    }, 200);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.isTyping.set(true);
    this.selectedIndex.set(-1);
    
    if (value.length >= this.minSearchLength) {
      this.showDropdown.set(true);
      this.searchSubject.next(value);
    } else {
      this.showDropdown.set(value.length > 0);
    }
    
    // Update form control immediately
    this.onChange(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    const filtered = this.filteredSuggestions;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.set(
          this.selectedIndex() < filtered.length - 1 
            ? this.selectedIndex() + 1 
            : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.set(
          this.selectedIndex() > 0 
            ? this.selectedIndex() - 1 
            : filtered.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex() >= 0 && this.selectedIndex() < filtered.length) {
          this.selectSuggestion(filtered[this.selectedIndex()]);
        } else if (this.hasCustomValue && this.allowCustomValue) {
          this.selectCustomValue();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showDropdown.set(false);
        break;
    }
  }

  selectSuggestion(suggestion: string): void {
    this.inputValue.set(suggestion);
    this.showDropdown.set(false);
    this.selectedIndex.set(-1);
    this.onChange(suggestion);
    this.valueSelected.emit(suggestion);
  }

  selectCustomValue(): void {
    const value = this.inputValue().trim();
    if (value) {
      this.showDropdown.set(false);
      this.onChange(value);
      this.customValueSelected.emit(value);
    }
  }

  clearValue(): void {
    this.inputValue.set('');
    this.showDropdown.set(false);
    this.selectedIndex.set(-1);
    this.onChange('');
    this.valueCleared.emit();
  }

  highlightMatch(text: string, query: string): string {
    if (!query || query.length < this.minSearchLength) {
      return text;
    }
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-blue-200">$1</mark>');
  }

  capitalizeRoleName(roleName: string): string {
    return roleName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

