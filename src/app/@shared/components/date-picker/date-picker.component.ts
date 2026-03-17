import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

type SelectionMode = 'date' | 'range';

@Component({
    selector: 'date-picker',
    templateUrl: './date-picker.component.html',
    styleUrl: './date-picker.component.css',
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: DatePickerComponent,
            multi: true,
        },
    ]
})
export class DatePickerComponent {
  @Input() minDate?: Date = new Date('2024-01-01');
  @Input() maxDate?: Date = new Date('2030-06-30');
  @Input() dateFormat: string = 'MM/dd/yyyy'; // Default format
  @Input() placeHolder: string = '';
  @Input() selectionMode: SelectionMode = 'date'; // Default to date picker
  @ViewChild('datepickerRef') datepickerRef!: ElementRef;
  dateRangeControl = new FormControl('');
  isOpen = false;
  currentDate = new Date();
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  today = new Date();
  calendarDays: Date[] = [];
  years: number[] = [];
  showYearSelect = false;
  showMonthSelect = false;
  weekDays: any[] = [];
  months:any[]=[];
  constructor() {
    // const currentYear = new Date().getFullYear();
    // this.minDate = new Date(currentYear - 5, 0, 1); // January 1, 5 years ago
    // this.maxDate = this.maxDate ?? new Date(currentYear, 11, 31);   // December 31, current year
    // this.initializeYears();
    this.placeHolder="Search by date";
  }
  // Function to manage ControlValueAccessor's writeValue method
  writeValue(value: any): void {
    if (value) {
      if (this.selectionMode === 'range') {
        const dates = value.split(' - ');
        if (dates.length === 2) {
          this.selectedStartDate = new Date(dates[0]);
          this.selectedEndDate = new Date(dates[1]);
        } else {
          this.selectedStartDate = new Date(value);
          this.selectedEndDate = null;
        }
      } else {
        // Single date mode
        this.selectedStartDate = new Date(value);
        this.selectedEndDate = null;
      }
    } else {
      this.selectedStartDate = null;
      this.selectedEndDate = null;
    }
    this.updateInput();
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  private onChange: any = () => {};

  private onTouched: any = () => {};
  ngOnInit() {
    this.weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.months = [
      { month: 'Jan' },
      { month: 'Feb' },
      { month: 'Mar' },
      { month: 'Apr' },
      { month: 'May' },
      { month: 'Jun' },
      { month: 'Jul' },
      { month: 'Aug' },
      { month: 'Sep' },
      { month: 'Oct' },
      { month: 'Nov' },
      { month: 'Dec' },
    ];
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 5, 0, 1); // January 1, 5 years ago
    this.maxDate = this.maxDate ?? new Date(currentYear, 11, 31); // December 31, current year
    this.initializeYears();

    this.generateCalendarDays();
    this.setupClickOutside();
  }

  get abbreviatedMonths(): string[] {
    return this.months.map((month) =>month.month==='Juillet'? month.month.substring(0, 4): month.month.substring(0, 3));
  }

  private setupClickOutside() {
    document.addEventListener('click', (event: MouseEvent) => {
      if (
        this.isOpen &&
        this.datepickerRef &&
        !this.datepickerRef.nativeElement.contains(event.target)
      ) {
        this.isOpen = false;
        this.showYearSelect = false;
        this.showMonthSelect = false;

        if (
          this.selectionMode === 'range' &&
          this.selectedStartDate &&
          !this.selectedEndDate
        ) {
          this.selectedStartDate = null;
          this.updateInput();
        }
      }
    });
  }

  private initializeYears() {
    if (this.minDate && this.maxDate) {
      const startYear = this.minDate.getFullYear();
      const endYear = this.maxDate.getFullYear();
      this.years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      );
    }
  }

  isPrevDisabled(): boolean {
    if (!this.minDate) return false;
    const prevMonthDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1
    );
    return prevMonthDate < this.minDate;
  }

  isNextDisabled(): boolean {
    if (!this.maxDate) return false;
    const nextMonthDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1
    );
    return nextMonthDate > this.maxDate;
  }

  generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month
    for (let i = firstDay.getDay(); i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push(prevDate);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    this.calendarDays = days;
  }

  isDateDisabled(date: Date): boolean {
    if (this.minDate && date < new Date(this.minDate.setHours(0, 0, 0, 0))) {
      return true;
    }
    if (
      this.maxDate &&
      date > new Date(this.maxDate.setHours(23, 59, 59, 999))
    ) {
      return true;
    }
    return false;
  }

  getDayClass(day: Date): string {
    const baseClass ='flex h-[40px] w-[40px] items-center justify-center text-sm';
    const currentMonth = day.getMonth() === this.currentDate.getMonth();
    const isDisabled = this.isDateDisabled(day);
    const isToday = this.isSameDay(day, this.today);

    let classes = [baseClass];

    if (isDisabled) {
      classes.push('cursor-not-allowed opacity-50');
    } else {
      classes.push('cursor-pointer');
    }

    if (!currentMonth) {
      classes.push('text-gray-400 ');
    } else if (!isToday) {
      classes.push('text-gray-700');
    }

    if (isToday) {
      classes.push(
        'bg-gray-500 border border-lime-300 text-white rounded-full'
      );
    }
    // Handle single date selection mode
    if (
      this.selectionMode === 'date' &&
      this.selectedStartDate &&
      this.isSameDay(day, this.selectedStartDate)
    ) {
      classes.push('!bg-blue-600 text-white rounded-full');
    }
    // Handle range selection mode
    else if (this.selectionMode === 'range') {
      if (
        this.selectedStartDate &&
        this.selectedEndDate &&
        this.isSameDay(day, this.selectedStartDate) &&
        this.isSameDay(day, this.selectedStartDate) &&
        this.isSameDay(this.selectedStartDate, this.selectedEndDate)
      ) {
        classes.push('bg-blue-600 text-white rounded-full');
      } else if (
        this.selectedStartDate &&
        this.isSameDay(day, this.selectedStartDate)
      ) {
        classes.push('bg-blue-600 text-white rounded-l-full');
      } else if (
        this.selectedEndDate &&
        this.isSameDay(day, this.selectedEndDate)
      ) {
        classes.push('bg-blue-600 text-white rounded-r-full');
      } else if (this.isInRange(day)) {
        classes.push(
          'bg-blue-100 text-blue-600'
        );
      }
      // Then handle current date with different color if not part of selection
      else if (isToday) {
        classes.push(
          'bg-gray-500 border border-lime-300 text-white rounded-full'
        );
      }
    }

    // Handle current date highlighting (if not selected)
    /* const isSelectedStart = this.selectedStartDate && this.isSameDay(day, this.selectedStartDate);
    const isSelectedEnd = this.selectedEndDate && this.isSameDay(day, this.selectedEndDate);

    if (isToday && !isSelectedStart && !isSelectedEnd) {
      classes.push('bg-orange-500 text-white rounded-full');
    } */

    return classes.join(' ');
  }

  selectYear(event: Event, year: number) {
    event.stopPropagation();
    event.preventDefault();
    this.currentDate = new Date(year, this.currentDate.getMonth());
    this.generateCalendarDays();
    this.showYearSelect = false; // Close the dropdown
  }

  selectMonth(event: Event, monthIndex: number) {
    event.stopPropagation();
    event.preventDefault();
    this.currentDate = new Date(this.currentDate.getFullYear(), monthIndex);
    this.generateCalendarDays();
    this.showMonthSelect = false; // Close the dropdown
  }

  toggleYearSelect(event: Event) {
    event.stopPropagation(); // Prevent the event from closing the dialog
    event.preventDefault();
    this.showYearSelect = !this.showYearSelect;
    this.showMonthSelect = false; // Close the month dropdown if open
  }

  toggleMonthSelect(event: Event) {
    event.stopPropagation(); // Prevent the event from closing the dialog
    event.preventDefault();
    this.showMonthSelect = !this.showMonthSelect;
    this.showYearSelect = false; // Close the year dropdown if open
  }

  isSameDay(date1: Date, date2: Date | null): boolean {
    if (!date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  isInRange(date: Date): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) {
      return false;
    }
    return (
      date.getTime() > this.selectedStartDate.getTime() &&
      date.getTime() < this.selectedEndDate.getTime()
    );
  }

  selectDate(date: Date) {
    if (this.selectionMode === 'date') {
      // Single date selection
      this.selectedStartDate = new Date(date);
      this.selectedEndDate = null;
      this.updateInput();
      this.isOpen = false; // Close the picker after selection
    } else {
      // Range selection
      if (
        !this.selectedStartDate ||
        (this.selectedStartDate && this.selectedEndDate)
      ) {
        this.selectedStartDate = new Date(date);
        this.selectedEndDate = null;
      } else {
        if (date < this.selectedStartDate) {
          this.selectedEndDate = new Date(this.selectedStartDate);
          this.selectedStartDate = new Date(date);
        } else {
          this.selectedEndDate = new Date(date);
        }
      }
      this.updateInput();
    }
  }

  private updateInput() {
    const formatDate = (date: Date): string => {
      if (!date) return '';
      const options: Intl.DateTimeFormatOptions = {};

      if (this.dateFormat.includes('yyyy')) options.year = 'numeric';
      if (this.dateFormat.includes('MM')) options.month = '2-digit';
      if (this.dateFormat.includes('dd')) options.day = '2-digit';

      return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    if (this.selectionMode === 'date' && this.selectedStartDate) {
      // Single date mode
      const dateStr = formatDate(this.selectedStartDate);
      this.dateRangeControl.setValue(dateStr);
      this.onChange(dateStr);
    } else if (this.selectionMode === 'range') {
      // Range mode
      if (this.selectedStartDate && this.selectedEndDate) {
        const startStr = formatDate(this.selectedStartDate);
        const endStr = formatDate(this.selectedEndDate);
        this.dateRangeControl.setValue(`${startStr} - ${endStr}`);
        this.onChange(`${startStr} - ${endStr}`);
      } else if (this.selectedStartDate) {
        this.dateRangeControl.setValue(formatDate(this.selectedStartDate));
        this.onChange(formatDate(this.selectedStartDate));
      } else {
        this.dateRangeControl.setValue('');
        this.onChange('');
      }
    }
  }

  /* toggleDatepicker(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.generateCalendarDays();
    }
  } */
  toggleDatepicker(event: Event) {
    event.stopPropagation();
    if (this.isOpen) {
      // Clear start date if end date is not selected when closing (only in range mode)
      if (
        this.selectionMode === 'range' &&
        this.selectedStartDate &&
        !this.selectedEndDate
      ) {
        this.selectedStartDate = null;
        this.updateInput();
      }
      this.isOpen = false;
    } else {
      this.isOpen = true;
      this.generateCalendarDays();
    }
  }

  prevMonth(event: Event) {
    event.preventDefault();
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1
    );
    this.generateCalendarDays();
  }

  nextMonth(event: Event) {
    event.preventDefault();
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1
    );
    this.generateCalendarDays();
  }

  cancel() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.dateRangeControl.setValue('');
    this.isOpen = false;
  }

  apply() {
    this.updateInput();
    this.isOpen = false;
  }
}
