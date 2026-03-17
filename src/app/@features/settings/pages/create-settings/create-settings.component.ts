import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SharedModule } from '@shared';
import { DynamicFormComponent, type FormField } from '@shared/components/dynamic-form';
import { SettingsService, type SettingsListResponse } from '../../services/settings.service';
import { MOCK_SETTINGS } from '../../models/settings.model';
import type { CreateSettingsPayload, Settings } from '../../models/settings.model';
import { AlertService } from '@core';

@Component({
  selector: 'app-create-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, DynamicFormComponent],
  templateUrl: './create-settings.component.html',
  styleUrl: './create-settings.component.css',
})
export class CreateSettingsComponent implements OnInit {
  settingsId: string | null = null;
  loading = true;
  loadError = false;
  submitting = false;
  initialData: Record<string, unknown> = {};

  readonly settingsFormFields: FormField[] = [
    {
      type: 'inputField',
      inputType: 'number',
      slug: 'pointsToCurrencyRate',
      label: 'Points to Currency Rate',
      required: true,
      placeholder: 'Enter points per 1 unit of currency',
      description: 'Conversion rate from points to currency',
      colSpan: 1,
    },
    {
      type: 'dropdownField',
      slug: 'currency',
      label: 'Currency',
      required: true,
      placeholder: 'Select a currency',
      description: 'Select the currency used for point redemption',
      options: [
        { label: 'USD - US Dollar', value: 'USD' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - British Pound', value: 'GBP' },
        { label: 'INR - Indian Rupee', value: 'INR' },
        { label: 'JPY - Japanese Yen', value: 'JPY' },
        { label: 'CAD - Canadian Dollar', value: 'CAD' },
        { label: 'AUD - Australian Dollar', value: 'AUD' },
      ],
      colSpan: 1,
    },
    {
      type: 'inputField',
      inputType: 'number',
      slug: 'minimumRedemptionPoints',
      label: 'Minimum Redemption Points',
      required: true,
      placeholder: 'Enter minimum points required',
      description: 'Minimum points required for redemption',
      colSpan: 1,
    },
    {
      type: 'inputField',
      inputType: 'number',
      slug: 'pointsExpiryDays',
      label: 'Points Expiry Days',
      required: false,
      placeholder: 'Enter expiry period in days',
      description: 'Number of days before points expire (leave empty for no expiry)',
      colSpan: 1,
    },
        {
      type: 'inputField',
      inputType: 'number',
      slug: 'redemptionProcessingDays',
      label: 'Redemption Processing Days',
      required: true,
      placeholder: 'Enter processing time in days',
      description: 'Number of days to process redemption',
      colSpan: 1,
    },
    {
      type: 'inputField',
      inputType: 'url',
      slug: 'apiwebhookUrl',
      label: 'Webhook URL',
      required: false,
      placeholder: 'Enter webhook URL',
      description: 'URL for referral webhook notifications',
      colSpan: 1,
    },
    {
      type: 'checkboxField',
      slug: 'allowNegativeBalance',
      label: 'Allow Negative Balance',
      required: false,
      colSpan: 1,
    },
    {
      type: 'inputField',
      inputType: 'text',
      slug: 'secretKey',
      label: 'Secret Key',
      required: true,
      placeholder: 'Enter Secret Key',
      description: 'Secret Key',
      colSpan: 1,
    }

  ];

  constructor(
    private readonly settingsService: SettingsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSettingsData();
  }

  private loadSettingsData(): void {
    this.loading = true;
    this.loadError = false;
    
    // Load existing settings from API
    this.settingsService.list().subscribe({
      next: (res: SettingsListResponse) => {
        if (res.status && res.data) {
          const settings = res.data;
          const settingsId = settings.uuid || String(settings.id) || 'current-settings';
          this.settingsId = settingsId;
          
          // Extract webhook URL from API response (API returns apiWebhookUrl with capital W)
          const rawData = res.data as any;
          const webhookUrl = rawData.apiWebhookUrl 
            || rawData.apiwebhookUrl 
            || rawData.webhookURL 
            || rawData.webhookUrl 
            || '';
          
          const settingsWithId: Settings = {
            ...settings,
            id: settingsId,
            apiwebhookUrl: webhookUrl ? String(webhookUrl) : '',
          };
          
          this.setInitialDataFromSettings(settingsWithId);
        } else {
          this.loadError = true;
        }
        this.loading = false;
      },
      error: () => {
        // Fallback to mock data if API fails
        const fromMock = MOCK_SETTINGS[0];
        if (fromMock) {
          this.settingsId = fromMock.uuid || String(fromMock.id) || 'current-settings';
          this.setInitialDataFromSettings(fromMock);
        } else {
          this.loadError = true;
        }
        this.loading = false;
      },
    });
  }

  private setInitialDataFromSettings(settings: Settings | Partial<Settings> | Record<string, unknown>): void {
    // Extract webhook URL, handling different possible field names
    const settingsRecord = settings as Record<string, unknown>;
    const webhookUrl = settingsRecord?.['apiWebhookUrl'] || '';
    
    // Set initial data with defaults if settings are empty/not available
    const settingsTyped = settings as Partial<Settings>;
    this.initialData = {
      pointsToCurrencyRate: settingsTyped?.pointsToCurrencyRate ?? 100,
      currency: settingsTyped?.currency ?? 'USD',
      minimumRedemptionPoints: settingsTyped?.minimumRedemptionPoints ?? 1000,
      pointsExpiryDays: settingsTyped?.pointsExpiryDays ?? null,
      allowNegativeBalance: settingsTyped?.allowNegativeBalance ?? false,
      redemptionProcessingDays: settingsTyped?.redemptionProcessingDays ?? 3,
      apiwebhookUrl: webhookUrl,
      secretKey: settingsTyped?.secretKey ?? 0
    };
    
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  async onFormSubmitted(payload: { values: Record<string, unknown>; isValid: boolean }): Promise<void> {
    if (!payload.isValid || this.submitting || !this.settingsId) return;

    // Show confirmation dialog before saving
    const confirmed = await this.alertService.showConfirm(
      'Confirm Update',
      'Are you sure you want to update the settings?',
      'question',
      'Yes, Update',
      'Cancel'
    );

    if (!confirmed) {
      return;
    }

    const pointsToCurrencyRate = this.parseRequiredNumber(payload.values['pointsToCurrencyRate'], 100);
    const minimumRedemptionPoints = this.parseRequiredNumber(payload.values['minimumRedemptionPoints'], 1000);
    const pointsExpiryDays = payload.values['pointsExpiryDays'] 
      ? this.parseOptionalNumber(payload.values['pointsExpiryDays']) 
      : null;
    const redemptionProcessingDays = this.parseRequiredNumber(payload.values['redemptionProcessingDays'], 3);

    const currencyValue = this.parseCurrencyValue(payload.values['currency']);
    const webhookUrl = typeof payload.values['apiwebhookUrl'] === 'string' 
      ? payload.values['apiwebhookUrl'].trim() 
      : '';
    
    const body: CreateSettingsPayload = {
      pointsToCurrencyRate,
      currency: currencyValue,
      minimumRedemptionPoints,
      pointsExpiryDays,
      allowNegativeBalance: payload.values['allowNegativeBalance'] === true,
      redemptionProcessingDays,
      ...(webhookUrl ? { apiWebhookUrl: webhookUrl } : {}),
      ...(payload.values['secretKey'] ? { secretKey: payload.values['secretKey'] as string } : {})
    };

    this.submitting = true;
    
    // Always use PATCH to update settings
    this.settingsService.update(this.settingsId, body).subscribe({
      next: () => {
        this.submitting = false;
        this.alertService.showSuccess('Settings updated successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        let errorMessage = 'Failed to update settings';
        
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid data. Please check your input.';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 404) {
          errorMessage = 'Settings not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.alertService.showError(errorMessage);
      },
    });
  }

  private parseRequiredNumber(value: unknown, defaultValue: number): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  private parseOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private parseCurrencyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'USD';
    }
    
    // If it's already a string, return it
    if (typeof value === 'string') {
      return value;
    }
    
    // If it's an object with a value property (from dropdown), use that
    if (typeof value === 'object' && value !== null && 'value' in value) {
      const currencyObj = value as { value: string; label?: string };
      return typeof currencyObj.value === 'string' ? currencyObj.value : 'USD';
    }
    
    // Default fallback
    return 'USD';
  }
}

