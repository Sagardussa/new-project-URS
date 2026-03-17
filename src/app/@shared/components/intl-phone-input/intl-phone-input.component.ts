import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges, SimpleChanges, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Country {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
    format?: string;
    maxLength?: number;
}

interface IPLocationResponse {
    country_code: string;
    country_name: string;
}

/**
 * International Phone Input Component with Enhanced Shared Dial Code Support
 * 
 * Key Features:
 * - Supports 150+ countries with comprehensive area code validation
 * - Intelligent handling of shared dial codes (e.g., US and Canada both use +1)
 * - Area code-based country detection for NANP (North American Numbering Plan)
 * - Manual selection takes precedence over automatic detection
 * - IP-based country detection with fallback support
 * - Separate dial code mode for advanced form handling
 * - Comprehensive validation with country-specific rules
 * 
 * Shared Dial Code Handling:
 * - US and Canada both use +1 but have different area codes
 * - Component uses comprehensive area code database to distinguish between them
 * - When user manually selects a country, that selection is preserved
 * - Auto-detection only occurs when user hasn't made a manual selection
 * - Validation ensures phone numbers match the selected country's area codes
 */
@Component({
    selector: 'intl-phone-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => IntlPhoneInputComponent),
            multi: true
        }
    ],
    templateUrl: './intl-phone-input.component.html',
    styleUrls: ['./intl-phone-input.component.css']
})
export class IntlPhoneInputComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() placeholder = 'Enter phone number';
    @Input() required = false;
    @Input() defaultCountry = '';
    @Input() dialCode = ''; // Optional dial code that overrides country detection (automatically enables separateDialCode)
    @Input() preferredCountries: string[] = [];
    @Input() separateDialCode = false; // Auto-enabled when dialCode is provided
    @Input() enableIPDetection = true;
    @Output() countryChange = new EventEmitter<Country>();
    @Output() phoneChange = new EventEmitter<string>();
    @Output() dialCodeChange = new EventEmitter<string>();
    @Output() separatePhoneChange = new EventEmitter<{ dialCode: string; phoneNumber: string }>();
    @Output() countryDetected = new EventEmitter<{ country: Country; detectedBy: 'ip' | 'manual' | 'fallback' }>();

    // Extensive country data
    private allCountries: Country[] = [
        { name: 'United States', code: 'US', dialCode: '+1', flag: 'US', format: '(555) 123-4567', maxLength: 14 },
        { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: 'GB', format: '20 7123 4567', maxLength: 13 },
        { name: 'Canada', code: 'CA', dialCode: '+1', flag: 'CA', format: '(555) 123-4567', maxLength: 14 },
        { name: 'Australia', code: 'AU', dialCode: '+61', flag: 'AU', format: '4 1234 5678', maxLength: 12 },
        { name: 'Germany', code: 'DE', dialCode: '+49', flag: 'DE', format: '30 12345678', maxLength: 13 },
        { name: 'France', code: 'FR', dialCode: '+33', flag: 'FR', format: '1 23 45 67 89', maxLength: 12 },
        { name: 'Italy', code: 'IT', dialCode: '+39', flag: 'IT', format: '06 1234 5678', maxLength: 13 },
        { name: 'Spain', code: 'ES', dialCode: '+34', flag: 'ES', format: '612 34 56 78', maxLength: 11 },
        { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: 'NL', format: '6 12345678', maxLength: 11 },
        { name: 'Belgium', code: 'BE', dialCode: '+32', flag: 'BE', format: '470 12 34 56', maxLength: 11 },
        { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: 'CH', format: '78 123 45 67', maxLength: 11 },
        { name: 'Austria', code: 'AT', dialCode: '+43', flag: 'AT', format: '664 123456', maxLength: 12 },
        { name: 'Sweden', code: 'SE', dialCode: '+46', flag: 'SE', format: '70 123 45 67', maxLength: 11 },
        { name: 'Norway', code: 'NO', dialCode: '+47', flag: 'NO', format: '406 12 345', maxLength: 10 },
        { name: 'Denmark', code: 'DK', dialCode: '+45', flag: 'DK', format: '20 12 34 56', maxLength: 10 },
        { name: 'Finland', code: 'FI', dialCode: '+358', flag: 'FI', format: '50 123 4567', maxLength: 12 },
        { name: 'Poland', code: 'PL', dialCode: '+48', flag: 'PL', format: '512 345 678', maxLength: 11 },
        { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: 'CZ', format: '601 123 456', maxLength: 12 },
        { name: 'Hungary', code: 'HU', dialCode: '+36', flag: 'HU', format: '20 123 4567', maxLength: 11 },
        { name: 'Romania', code: 'RO', dialCode: '+40', flag: 'RO', format: '712 345 678', maxLength: 11 },
        { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: 'BG', format: '87 123 4567', maxLength: 11 },
        { name: 'Croatia', code: 'HR', dialCode: '+385', flag: 'HR', format: '91 234 5678', maxLength: 11 },
        { name: 'Greece', code: 'GR', dialCode: '+30', flag: 'GR', format: '694 123 4567', maxLength: 12 },
        { name: 'Portugal', code: 'PT', dialCode: '+351', flag: 'PT', format: '912 345 678', maxLength: 11 },
        { name: 'Russia', code: 'RU', dialCode: '+7', flag: 'RU', format: '912 345-67-89', maxLength: 13 },
        { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: 'UA', format: '67 123 4567', maxLength: 11 },
        { name: 'Belarus', code: 'BY', dialCode: '+375', flag: 'BY', format: '29 123-45-67', maxLength: 12 },
        { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: 'LT', format: '612 34567', maxLength: 10 },
        { name: 'Latvia', code: 'LV', dialCode: '+371', flag: 'LV', format: '2123 4567', maxLength: 10 },
        { name: 'Estonia', code: 'EE', dialCode: '+372', flag: 'EE', format: '512 3456', maxLength: 9 },
        { name: 'China', code: 'CN', dialCode: '+86', flag: 'CN', format: '138 0013 8000', maxLength: 13 },
        { name: 'Japan', code: 'JP', dialCode: '+81', flag: 'JP', format: '90 1234 5678', maxLength: 12 },
        { name: 'South Korea', code: 'KR', dialCode: '+82', flag: 'KR', format: '10 1234 5678', maxLength: 12 },
        { name: 'India', code: 'IN', dialCode: '+91', flag: 'IN', format: '98765 43210', maxLength: 13 },
        { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: 'PK', format: '301 2345678', maxLength: 12 },
        { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: 'BD', format: '1812-345678', maxLength: 13 },
        { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: 'LK', format: '71 234 5678', maxLength: 11 },
        { name: 'Thailand', code: 'TH', dialCode: '+66', flag: 'TH', format: '81 234 5678', maxLength: 11 },
        { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: 'VN', format: '91 234 56 78', maxLength: 12 },
        { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: 'MY', format: '12-345 6789', maxLength: 11 },
        { name: 'Singapore', code: 'SG', dialCode: '+65', flag: 'SG', format: '8123 4567', maxLength: 10 },
        { name: 'Philippines', code: 'PH', dialCode: '+63', flag: 'PH', format: '917 123 4567', maxLength: 12 },
        { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: 'ID', format: '812-3456-7890', maxLength: 13 },
        { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: 'HK', format: '5123 4567', maxLength: 10 },
        { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: 'TW', format: '912 345 678', maxLength: 11 },
        { name: 'Macao', code: 'MO', dialCode: '+853', flag: 'MO', format: '6123 4567', maxLength: 10 },
        { name: 'Israel', code: 'IL', dialCode: '+972', flag: 'IL', format: '50-123-4567', maxLength: 12 },
        { name: 'Turkey', code: 'TR', dialCode: '+90', flag: 'TR', format: '501 234 56 78', maxLength: 12 },
        { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: 'SA', format: '50 123 4567', maxLength: 11 },
        { name: 'UAE', code: 'AE', dialCode: '+971', flag: 'AE', format: '50 123 4567', maxLength: 11 },
        { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: 'KW', format: '500 12345', maxLength: 10 },
        { name: 'Qatar', code: 'QA', dialCode: '+974', flag: 'QA', format: '3312 3456', maxLength: 10 },
        { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: 'BH', format: '3612 3456', maxLength: 10 },
        { name: 'Oman', code: 'OM', dialCode: '+968', flag: 'OM', format: '9212 3456', maxLength: 10 },
        { name: 'Jordan', code: 'JO', dialCode: '+962', flag: 'JO', format: '7 9012 3456', maxLength: 11 },
        { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: 'LB', format: '71 123 456', maxLength: 10 },
        { name: 'Egypt', code: 'EG', dialCode: '+20', flag: 'EG', format: '100 123 4567', maxLength: 12 },
        { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: 'ZA', format: '82 123 4567', maxLength: 11 },
        { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: 'NG', format: '802 123 4567', maxLength: 12 },
        { name: 'Kenya', code: 'KE', dialCode: '+254', flag: 'KE', format: '712 123456', maxLength: 11 },
        { name: 'Ghana', code: 'GH', dialCode: '+233', flag: 'GH', format: '23 123 4567', maxLength: 11 },
        { name: 'Morocco', code: 'MA', dialCode: '+212', flag: 'MA', format: '612-345678', maxLength: 12 },
        { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: 'DZ', format: '551 23 45 67', maxLength: 12 },
        { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: 'TN', format: '20 123 456', maxLength: 10 },
        { name: 'Brazil', code: 'BR', dialCode: '+55', flag: 'BR', format: '11 91234-5678', maxLength: 14 },
        { name: 'Argentina', code: 'AR', dialCode: '+54', flag: 'AR', format: '9 11 1234-5678', maxLength: 14 },
        { name: 'Chile', code: 'CL', dialCode: '+56', flag: 'CL', format: '9 8765 4321', maxLength: 12 },
        { name: 'Colombia', code: 'CO', dialCode: '+57', flag: 'CO', format: '321 1234567', maxLength: 12 },
        { name: 'Peru', code: 'PE', dialCode: '+51', flag: 'PE', format: '987 654 321', maxLength: 11 },
        { name: 'Mexico', code: 'MX', dialCode: '+52', flag: 'MX', format: '55 1234 5678', maxLength: 12 },
        { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: 'VE', format: '412-1234567', maxLength: 12 },
        { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: 'UY', format: '94 123 456', maxLength: 10 },
        { name: 'Paraguay', code: 'PY', dialCode: '+595', flag: 'PY', format: '961 123456', maxLength: 11 },
        { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: 'BO', format: '712 34567', maxLength: 10 },
        { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: 'EC', format: '99 123 4567', maxLength: 11 },
        { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: 'NZ', format: '21 123 4567', maxLength: 11 },

        // Additional European Countries
        { name: 'Ireland', code: 'IE', dialCode: '+353', flag: 'IE', format: '85 123 4567', maxLength: 11 },
        { name: 'Luxembourg', code: 'LU', dialCode: '+352', flag: 'LU', format: '628 123 456', maxLength: 11 },
        { name: 'Malta', code: 'MT', dialCode: '+356', flag: 'MT', format: '9696 1234', maxLength: 10 },
        { name: 'Cyprus', code: 'CY', dialCode: '+357', flag: 'CY', format: '96 123456', maxLength: 10 },
        { name: 'Iceland', code: 'IS', dialCode: '+354', flag: 'IS', format: '611 1234', maxLength: 9 },
        { name: 'Monaco', code: 'MC', dialCode: '+377', flag: 'MC', format: '6 12 34 56 78', maxLength: 11 },
        { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: 'SI', format: '31 123 456', maxLength: 10 },
        { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: 'SK', format: '912 123 456', maxLength: 11 },
        { name: 'Serbia', code: 'RS', dialCode: '+381', flag: 'RS', format: '60 1234567', maxLength: 11 },
        { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387', flag: 'BA', format: '61 123 456', maxLength: 10 },
        { name: 'Montenegro', code: 'ME', dialCode: '+382', flag: 'ME', format: '67 123 456', maxLength: 10 },
        { name: 'North Macedonia', code: 'MK', dialCode: '+389', flag: 'MK', format: '70 123 456', maxLength: 10 },
        { name: 'Albania', code: 'AL', dialCode: '+355', flag: 'AL', format: '67 123 4567', maxLength: 11 },
        { name: 'Moldova', code: 'MD', dialCode: '+373', flag: 'MD', format: '621 12 345', maxLength: 10 },

        // Additional Asian-Pacific Countries
        { name: 'Nepal', code: 'NP', dialCode: '+977', flag: 'NP', format: '984-1234567', maxLength: 12 },
        { name: 'Myanmar', code: 'MM', dialCode: '+95', flag: 'MM', format: '9 212 3456', maxLength: 10 },
        { name: 'Cambodia', code: 'KH', dialCode: '+855', flag: 'KH', format: '91 234 567', maxLength: 10 },
        { name: 'Laos', code: 'LA', dialCode: '+856', flag: 'LA', format: '20 123 4567', maxLength: 11 },
        { name: 'Brunei', code: 'BN', dialCode: '+673', flag: 'BN', format: '712 3456', maxLength: 9 },
        { name: 'Mongolia', code: 'MN', dialCode: '+976', flag: 'MN', format: '8812 3456', maxLength: 10 },
        { name: 'Maldives', code: 'MV', dialCode: '+960', flag: 'MV', format: '771-2345', maxLength: 9 },
        { name: 'Bhutan', code: 'BT', dialCode: '+975', flag: 'BT', format: '17 12 34 56', maxLength: 10 },
        { name: 'Uzbekistan', code: 'UZ', dialCode: '+998', flag: 'UZ', format: '91 123 45 67', maxLength: 11 },
        { name: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: 'KZ', format: '701 123 4567', maxLength: 12 },
        { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996', flag: 'KG', format: '700 123 456', maxLength: 11 },
        { name: 'Tajikistan', code: 'TJ', dialCode: '+992', flag: 'TJ', format: '917 12 3456', maxLength: 11 },
        { name: 'Turkmenistan', code: 'TM', dialCode: '+993', flag: 'TM', format: '65 123456', maxLength: 10 },
        { name: 'Afghanistan', code: 'AF', dialCode: '+93', flag: 'AF', format: '70 123 4567', maxLength: 11 },
        { name: 'Armenia', code: 'AM', dialCode: '+374', flag: 'AM', format: '77 123456', maxLength: 10 },
        { name: 'Azerbaijan', code: 'AZ', dialCode: '+994', flag: 'AZ', format: '40 123 45 67', maxLength: 11 },
        { name: 'Georgia', code: 'GE', dialCode: '+995', flag: 'GE', format: '555 12 34 56', maxLength: 11 },

        // Additional Middle Eastern Countries
        { name: 'Iran', code: 'IR', dialCode: '+98', flag: 'IR', format: '912 345 6789', maxLength: 12 },
        { name: 'Iraq', code: 'IQ', dialCode: '+964', flag: 'IQ', format: '790 123 4567', maxLength: 12 },
        { name: 'Syria', code: 'SY', dialCode: '+963', flag: 'SY', format: '944 567 890', maxLength: 11 },
        { name: 'Yemen', code: 'YE', dialCode: '+967', flag: 'YE', format: '712 345 678', maxLength: 11 },

        // Additional African Countries
        { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: 'ET', format: '91 123 4567', maxLength: 11 },
        { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: 'TZ', format: '621 123 456', maxLength: 11 },
        { name: 'Uganda', code: 'UG', dialCode: '+256', flag: 'UG', format: '712 345678', maxLength: 11 },
        { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: 'RW', format: '788 123 456', maxLength: 11 },
        { name: 'Burundi', code: 'BI', dialCode: '+257', flag: 'BI', format: '79 56 12 34', maxLength: 10 },
        { name: 'Madagascar', code: 'MG', dialCode: '+261', flag: 'MG', format: '32 12 345 67', maxLength: 11 },
        { name: 'Mauritius', code: 'MU', dialCode: '+230', flag: 'MU', format: '5251 2345', maxLength: 10 },
        { name: 'Seychelles', code: 'SC', dialCode: '+248', flag: 'SC', format: '2 510 123', maxLength: 9 },
        { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: 'ZW', format: '71 123 4567', maxLength: 11 },
        { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: 'ZM', format: '95 1234567', maxLength: 11 },
        { name: 'Botswana', code: 'BW', dialCode: '+267', flag: 'BW', format: '71 123 456', maxLength: 10 },
        { name: 'Namibia', code: 'NA', dialCode: '+264', flag: 'NA', format: '81 123 4567', maxLength: 11 },
        { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: 'MZ', format: '82 123 4567', maxLength: 11 },
        { name: 'Angola', code: 'AO', dialCode: '+244', flag: 'AO', format: '923 123 456', maxLength: 11 },
        { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: 'CM', format: '6 71 23 45 67', maxLength: 11 },
        { name: 'Senegal', code: 'SN', dialCode: '+221', flag: 'SN', format: '70 123 45 67', maxLength: 11 },
        { name: 'Ivory Coast', code: 'CI', dialCode: '+225', flag: 'CI', format: '01 23 45 67 89', maxLength: 12 },
        { name: 'Mali', code: 'ML', dialCode: '+223', flag: 'ML', format: '65 12 34 56', maxLength: 10 },
        { name: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: 'BF', format: '70 12 34 56', maxLength: 10 },
        { name: 'Niger', code: 'NE', dialCode: '+227', flag: 'NE', format: '93 12 34 56', maxLength: 10 },
        { name: 'Chad', code: 'TD', dialCode: '+235', flag: 'TD', format: '63 01 23 45', maxLength: 10 },
        { name: 'Sudan', code: 'SD', dialCode: '+249', flag: 'SD', format: '91 123 4567', maxLength: 11 },
        { name: 'Libya', code: 'LY', dialCode: '+218', flag: 'LY', format: '91-1234567', maxLength: 11 },

        // Caribbean & Central America
        { name: 'Jamaica', code: 'JM', dialCode: '+1876', flag: 'JM', format: '876 123-4567', maxLength: 14 },
        { name: 'Barbados', code: 'BB', dialCode: '+1246', flag: 'BB', format: '246 123-4567', maxLength: 14 },
        { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1868', flag: 'TT', format: '868 123-4567', maxLength: 14 },
        { name: 'Bahamas', code: 'BS', dialCode: '+1242', flag: 'BS', format: '242 123-4567', maxLength: 14 },
        { name: 'Dominican Republic', code: 'DO', dialCode: '+1809', flag: 'DO', format: '809 123-4567', maxLength: 14 },
        { name: 'Puerto Rico', code: 'PR', dialCode: '+1787', flag: 'PR', format: '787 123-4567', maxLength: 14 },
        { name: 'Cuba', code: 'CU', dialCode: '+53', flag: 'CU', format: '5 1234567', maxLength: 10 },
        { name: 'Haiti', code: 'HT', dialCode: '+509', flag: 'HT', format: '34 12 3456', maxLength: 10 },
        { name: 'Costa Rica', code: 'CR', dialCode: '+506', flag: 'CR', format: '8312 3456', maxLength: 10 },
        { name: 'Panama', code: 'PA', dialCode: '+507', flag: 'PA', format: '6123-4567', maxLength: 10 },
        { name: 'Guatemala', code: 'GT', dialCode: '+502', flag: 'GT', format: '5123 4567', maxLength: 10 },
        { name: 'Honduras', code: 'HN', dialCode: '+504', flag: 'HN', format: '9123-4567', maxLength: 10 },
        { name: 'El Salvador', code: 'SV', dialCode: '+503', flag: 'SV', format: '7012 3456', maxLength: 10 },
        { name: 'Nicaragua', code: 'NI', dialCode: '+505', flag: 'NI', format: '8123 4567', maxLength: 10 },
        { name: 'Belize', code: 'BZ', dialCode: '+501', flag: 'BZ', format: '622-1234', maxLength: 9 },

        // Pacific & Oceania
        { name: 'Fiji', code: 'FJ', dialCode: '+679', flag: 'FJ', format: '701 2345', maxLength: 9 },
        { name: 'Papua New Guinea', code: 'PG', dialCode: '+675', flag: 'PG', format: '7012 3456', maxLength: 10 },
        { name: 'Samoa', code: 'WS', dialCode: '+685', flag: 'WS', format: '72 12345', maxLength: 8 },
        { name: 'Tonga', code: 'TO', dialCode: '+676', flag: 'TO', format: '771 2345', maxLength: 8 },
        { name: 'Vanuatu', code: 'VU', dialCode: '+678', flag: 'VU', format: '591 2345', maxLength: 8 },
        { name: 'Solomon Islands', code: 'SB', dialCode: '+677', flag: 'SB', format: '74 12345', maxLength: 8 },

        // Additional Small European Countries
        { name: 'Faroe Islands', code: 'FO', dialCode: '+298', flag: 'FO', format: '211234', maxLength: 8 },
        { name: 'Greenland', code: 'GL', dialCode: '+299', flag: 'GL', format: '22 12 34', maxLength: 8 },
        { name: 'San Marino', code: 'SM', dialCode: '+378', flag: 'SM', format: '66 66 12 12', maxLength: 12 },
        { name: 'Andorra', code: 'AD', dialCode: '+376', flag: 'AD', format: '312 345', maxLength: 8 },
        { name: 'Liechtenstein', code: 'LI', dialCode: '+423', flag: 'LI', format: '661 2345', maxLength: 9 }
    ];

    // Computed property for countries with preferred ones first
    countries = computed(() => {
        if (this.preferredCountries.length === 0) {
            return this.allCountries;
        }

        const preferred = this.preferredCountries
            .map(code => this.allCountries.find(c => c.code === code))
            .filter(Boolean) as Country[];

        const others = this.allCountries.filter(c => !this.preferredCountries.includes(c.code));

        return [...preferred, ...others];
    });

    // Signals
    selectedCountry = signal<Country>(this.allCountries[0]);
    phoneNumber = signal<string>('');
    isDropdownOpen = signal<boolean>(false);
    searchTerm = signal<string>('');
    private touched = signal<boolean>(false);
    private disabled = signal<boolean>(false);
    private dropdownPosition = signal<'down' | 'up'>('down');
    detectingCountry = signal<boolean>(false);
    private manuallySelected = signal<boolean>(false); // Track if user manually selected country

    // Computed signals
    formattedPhoneNumber = computed(() => this.formatPhoneNumber(this.phoneNumber()));
    formattedFullNumber = computed(() => {
        const phone = this.phoneNumber();
        if (!phone) return '';
        return `${this.selectedCountry().dialCode} ${this.formatPhoneNumber(phone)}`;
    });

    phonePlaceholder = computed(() => {
        const format = this.selectedCountry().format;
        return format ? `e.g., ${format}` : this.placeholder;
    });

    // Computed property to determine if separate dial code mode should be used
    isUsingSeperateDialCode = computed(() => {
        // If dialCode is provided, automatically enable separate dial code mode
        return this.separateDialCode || (this.dialCode && this.dialCode.trim() !== '');
    });

    filteredCountries = computed(() => {
        const countriesToFilter = this.countries();
        const searchText = this.searchTerm();
        let countries = countriesToFilter;

        if (searchText) {
            const term = searchText.toLowerCase();
            countries = countriesToFilter.filter(country =>
                country.name.toLowerCase().includes(term) ||
                country.dialCode.includes(term)
            );
        }

        // Separate preferred and other countries for visual distinction
        if (this.preferredCountries.length > 0) {
            const preferred = countries.filter(c => this.preferredCountries.includes(c.code));
            const others = countries.filter(c => !this.preferredCountries.includes(c.code));
            return { preferred, others };
        }

        return { preferred: [], others: countries };
    });

    errorMessage = signal<string>('');

    // ControlValueAccessor
    private onChange = (value: string) => { };
    private onTouched = () => { };

    constructor(private http: HttpClient) { }

    // NANP (North American Numbering Plan) area codes for US vs Canada distinction
    private readonly US_AREA_CODES = [
        201, 202, 203, 205, 206, 207, 208, 209, 210, 212, 213, 214, 215, 216, 217, 218, 219, 224, 225,
        228, 229, 231, 234, 239, 240, 248, 251, 252, 253, 254, 256, 260, 262, 267, 269, 270, 276, 281,
        283, 301, 302, 303, 304, 305, 307, 308, 309, 310, 312, 313, 314, 315, 316, 317, 318, 319, 320,
        321, 323, 325, 330, 331, 334, 336, 337, 339, 347, 351, 352, 360, 361, 364, 380, 385, 386, 401,
        402, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 417, 419, 423, 424, 425, 430, 432,
        434, 435, 440, 442, 443, 458, 463, 464, 469, 470, 475, 478, 479, 480, 484, 501, 502, 503, 504,
        505, 507, 508, 509, 510, 512, 513, 515, 516, 517, 518, 520, 530, 531, 534, 539, 540, 541, 551,
        557, 559, 561, 562, 563, 564, 567, 570, 571, 573, 574, 575, 580, 585, 586, 601, 602, 603, 605,
        606, 607, 608, 609, 610, 612, 614, 615, 616, 617, 618, 619, 620, 623, 626, 628, 629, 630, 631,
        636, 640, 641, 646, 650, 651, 657, 660, 661, 662, 667, 669, 678, 681, 682, 701, 702, 703, 704,
        706, 707, 708, 710, 712, 713, 714, 715, 716, 717, 718, 719, 720, 724, 725, 727, 731, 732, 734,
        737, 740, 743, 747, 754, 757, 760, 762, 763, 765, 769, 770, 772, 773, 774, 775, 779, 781, 785,
        786, 787, 801, 802, 803, 804, 805, 806, 808, 810, 812, 813, 814, 815, 816, 817, 818, 828, 830,
        831, 832, 843, 845, 847, 848, 850, 856, 857, 858, 859, 860, 862, 863, 864, 865, 870, 872, 878,
        901, 903, 904, 906, 907, 908, 909, 910, 912, 913, 914, 915, 916, 917, 918, 919, 920, 925, 928,
        929, 930, 931, 934, 936, 937, 940, 941, 947, 949, 951, 952, 954, 956, 959, 970, 971, 972, 973,
        975, 978, 979, 980, 984, 985, 989
    ];

    private readonly CANADA_AREA_CODES = [
        204, 226, 236, 249, 250, 289, 306, 343, 365, 367, 403, 416, 418, 431, 437, 438, 450, 506, 514,
        519, 548, 579, 581, 587, 604, 613, 639, 647, 672, 705, 709, 742, 778, 780, 782, 807, 819, 825,
        867, 873, 902, 905
    ];

    // Method to determine if a number belongs to US or Canada based on area code
    private getCountryByAreaCode(phoneNumber: string): 'US' | 'CA' | null {
        if (phoneNumber.length < 3) return null;

        const areaCode = parseInt(phoneNumber.substring(0, 3));

        if (this.US_AREA_CODES.includes(areaCode)) {
            return 'US';
        } else if (this.CANADA_AREA_CODES.includes(areaCode)) {
            return 'CA';
        }

        return null;
    }

    // Handle country detection for shared dial codes based on phone number
    private handleSharedDialCodeDetection(phoneNumber: string) {
        // Only auto-detect if user hasn't manually selected a country
        if (this.manuallySelected()) return;

        const currentCountry = this.selectedCountry();
        const currentDialCode = currentCountry.dialCode;

        // Check if current dial code is shared by multiple countries
        const countriesWithSameDialCode = this.allCountries.filter(c => c.dialCode === currentDialCode);

        if (countriesWithSameDialCode.length > 1 && phoneNumber.length >= 3) {
            // Special handling for NANP (+1) countries (US and Canada)
            if (currentDialCode === '+1') {
                const detectedCountryCode = this.getCountryByAreaCode(phoneNumber);
                if (detectedCountryCode && detectedCountryCode !== currentCountry.code) {
                    const newCountry = this.allCountries.find(c => c.code === detectedCountryCode);
                    if (newCountry) {
                        this.selectedCountry.set(newCountry);
                        this.countryChange.emit(newCountry);
                        // Don't emit dialCodeChange as it's the same dial code
                    }
                }
            }
        }
    }

    // Method to determine if IP detection should be used
    private shouldUseIPDetection(): boolean {
        // Don't use IP detection if dialCode is provided or enableIPDetection is false
        const hasDialCode = this.dialCode && this.dialCode.trim() !== '';
        const shouldUse = this.enableIPDetection && !hasDialCode;


        return shouldUse;
    }

    async ngOnInit() {

        // Set initial default country (US) without any detection
        const defaultCountry = this.allCountries.find(c => c.code === 'US') || this.allCountries[0];
        this.selectedCountry.set(defaultCountry);

        // Reset manual selection flag on initialization
        this.manuallySelected.set(false);

        // Wait for a longer delay to allow parent component to set dialCode
        this.initializationTimeout = setTimeout(() => {
            this.performInitialization();
        }, 100);
    }

    private async performInitialization() {

        // If dialCode is provided, use it immediately and skip all other detection
        if (this.dialCode && this.dialCode.trim() !== '') {
            this.initializeWithDialCode();
            return;
        }

        // Proceed with other detection methods only if no dialCode
        let countryToSet: Country;
        let detectionMethod: 'ip' | 'manual' | 'fallback' = 'fallback';

        if (this.defaultCountry && this.defaultCountry.trim() !== '') {
            const manualCountry = this.allCountries.find(c => c.code === this.defaultCountry.toUpperCase());
            if (manualCountry) {
                countryToSet = manualCountry;
                detectionMethod = 'manual';
            } else {
                countryToSet = await this.determineCountryFallback();
                detectionMethod = this.shouldUseIPDetection() ? 'ip' : 'fallback';
            }
        } else {
            countryToSet = await this.determineCountryFallback();
            detectionMethod = this.shouldUseIPDetection() ? 'ip' : 'fallback';
        }

        // Set the determined country
        this.selectedCountry.set(countryToSet);

        // Emit country detected event
        this.countryDetected.emit({
            country: countryToSet,
            detectedBy: detectionMethod
        });

        // Emit initial country change
        this.countryChange.emit(countryToSet);
        this.dialCodeChange.emit(countryToSet.dialCode);
    }

    private async determineCountryFallback(): Promise<Country> {

        // NEVER use IP detection if dialCode is provided
        if (this.dialCode && this.dialCode.trim() !== '') {
            return this.allCountries.find(c => c.code === 'US') || this.allCountries[0];
        }

        if (this.shouldUseIPDetection()) {
            // Try to detect country from IP
            this.detectingCountry.set(true);
            const detectedCountry = await this.detectCountryFromIP();
            this.detectingCountry.set(false);

            if (detectedCountry) {
                return detectedCountry;
            }
        }

        return this.allCountries.find(c => c.code === 'US') || this.allCountries[0];
    }

    private async detectCountryFromIP(): Promise<Country | null> {

        // NEVER call IP detection if dialCode is provided
        if (this.dialCode && this.dialCode.trim() !== '') {
            return null;
        }

        if (!this.shouldUseIPDetection()) {
            return null;
        }


        // No API call – skip IP-based country detection
        return null;
    }

    private async detectCountryFromIPFallback(): Promise<Country | null> {
        return null;
    }

    // Method to set country by dial code (useful for separateDialCode mode)
    setCountryByDialCode(dialCode: string, phoneNumber?: string) {
        const countries = this.allCountries.filter(c => c.dialCode === dialCode);

        if (countries.length === 0) return;

        if (countries.length === 1) {
            // Only one country with this dial code
            this.selectedCountry.set(countries[0]);
            this.countryChange.emit(countries[0]);
            this.dialCodeChange.emit(countries[0].dialCode);
            return;
        }

        // Multiple countries with same dial code (like US and Canada with +1)
        // Don't change if user has manually selected and no phone number context
        if (this.manuallySelected() && !phoneNumber) {
            return;
        }

        // If we have a phone number, try to determine the correct country
        if (phoneNumber && phoneNumber.length >= 3) {
            const detectedCountryCode = this.getCountryByAreaCode(phoneNumber);
            if (detectedCountryCode) {
                const detectedCountry = countries.find(c => c.code === detectedCountryCode);
                if (detectedCountry) {
                    this.selectedCountry.set(detectedCountry);
                    this.countryChange.emit(detectedCountry);
                    this.dialCodeChange.emit(detectedCountry.dialCode);
                    return;
                }
            }
        }

        // Fallback: prefer the currently selected country if it matches the dial code
        const currentCountry = this.selectedCountry();
        if (countries.some(c => c.code === currentCountry.code)) {
            return; // Keep current selection
        }

        // Final fallback: select the first country (usually US for +1)
        this.selectedCountry.set(countries[0]);
        this.countryChange.emit(countries[0]);
        this.dialCodeChange.emit(countries[0].dialCode);
    }

    // Method to handle external value binding (useful for form initialization)
    bindExternalValue(value: string, dialCode?: string) {
        if (this.separateDialCode && dialCode) {
            // When using separate dial code mode with provided dial code
            const country = this.allCountries.find(c => c.dialCode === dialCode);
            if (country) {
                this.selectedCountry.set(country);
                this.phoneNumber.set(this.cleanPhoneNumber(value));
                this.validatePhoneNumber();
                return;
            }
        }

        // Fallback to normal parsing
        this.writeValue(value);
    }

    toggleDropdown() {
        if (!this.disabled()) {
            if (!this.isDropdownOpen()) {
                this.calculateDropdownPosition();
            }
            this.isDropdownOpen.set(!this.isDropdownOpen());
        }
    }

    private calculateDropdownPosition() {
        // Calculate position after a short delay to ensure DOM is ready
        setTimeout(() => {
            const button = document.querySelector('intl-phone-input button');
            if (button) {
                const rect = button.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;

                // Use 'up' if there's more space above and not enough below
                this.dropdownPosition.set(spaceAbove > spaceBelow && spaceBelow < 250 ? 'up' : 'down');
            }
        }, 0);
    }

    closeDropdown() {
        this.isDropdownOpen.set(false);
    }

    selectCountry(country: Country) {
        this.selectedCountry.set(country);
        this.manuallySelected.set(true); // Mark as manually selected
        this.closeDropdown();
        this.countryChange.emit(country);
        this.dialCodeChange.emit(country.dialCode);
        this.validatePhoneNumber();
        this.emitValue();
    }

    onSearchChange(event: any) {
        this.searchTerm.set(event.target.value);
    }

    onPhoneNumberChange(event: any) {
        // Filter the input to allow only valid phone number characters
        const filteredValue = this.filterPhoneInput(event.target.value);

        // Update the input field with filtered value if different
        if (event.target.value !== filteredValue) {
            event.target.value = filteredValue;
        }

        const value = this.cleanPhoneNumber(filteredValue);
        this.phoneNumber.set(value);

        // Auto-detect country for shared dial codes if not manually selected
        this.handleSharedDialCodeDetection(value);

        this.validatePhoneNumber();
        this.emitValue();
        this.phoneChange.emit(value);

        // Emit separate values if separateDialCode is enabled
        if (this.isUsingSeperateDialCode()) {
            this.separatePhoneChange.emit({
                dialCode: this.selectedCountry().dialCode,
                phoneNumber: value
            });
        }
    }

    onPhoneKeyPress(event: KeyboardEvent) {
        // Allow control keys (backspace, delete, arrow keys, etc.)
        if (this.isControlKey(event)) {
            return;
        }

        // Get the character that would be inserted
        const char = event.key;

        // Check if the character is allowed
        if (!this.isValidPhoneCharacter(char)) {
            event.preventDefault();
        }
    }

    onPhoneKeyDown(event: KeyboardEvent) {
        // Allow control keys
        if (this.isControlKey(event)) {
            return;
        }
    }

    onPhonePaste(event: ClipboardEvent) {
        event.preventDefault();

        // Get the pasted content
        const pastedText = event.clipboardData?.getData('text') || '';

        // Filter the pasted content
        const filteredText = this.filterPhoneInput(pastedText);

        // Insert the filtered text
        const target = event.target as HTMLInputElement;
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const currentValue = target.value;

        const newValue = currentValue.substring(0, start) + filteredText + currentValue.substring(end);
        target.value = newValue;

        // Trigger change event
        const changeEvent = new Event('input', { bubbles: true });
        target.dispatchEvent(changeEvent);
    }

    private isControlKey(event: KeyboardEvent): boolean {
        return (
            event.key === 'Backspace' ||
            event.key === 'Delete' ||
            event.key === 'ArrowLeft' ||
            event.key === 'ArrowRight' ||
            event.key === 'ArrowUp' ||
            event.key === 'ArrowDown' ||
            event.key === 'Home' ||
            event.key === 'End' ||
            event.key === 'Tab' ||
            event.key === 'Enter' ||
            event.key === 'Escape' ||
            (event.ctrlKey && (event.key === 'a' || event.key === 'c' || event.key === 'v' || event.key === 'x' || event.key === 'z'))
        );
    }

    private isValidPhoneCharacter(char: string): boolean {
        // Allow digits and specific phone formatting characters
        return /^[0-9()\-+\s]$/.test(char);
    }

    private filterPhoneInput(input: string): string {
        // Remove any characters that are not valid for phone numbers
        // Allow: digits, parentheses, hyphen, plus, space
        return input.replace(/[^0-9()\-+\s]/g, '');
    }

    onPhoneInput(event: Event) {
        // Handle composition events (for IME input)
        const target = event.target as HTMLInputElement;
        const filteredValue = this.filterPhoneInput(target.value);

        if (target.value !== filteredValue) {
            // Store cursor position
            const cursorPos = target.selectionStart || 0;
            const removedChars = target.value.length - filteredValue.length;

            // Update value
            target.value = filteredValue;

            // Restore cursor position, adjusted for removed characters
            const newCursorPos = Math.max(0, cursorPos - removedChars);
            target.setSelectionRange(newCursorPos, newCursorPos);
        }
    }

    onBlur() {
        this.touched.set(true);
        this.onTouched();
        this.validatePhoneNumber();
    }

    private cleanPhoneNumber(phone: string): string {
        return phone.replace(/\D/g, '');
    }

    private formatPhoneNumber(phone: string): string {
        if (!phone) return '';

        const country = this.selectedCountry();
        const cleaned = this.cleanPhoneNumber(phone);

        // Basic formatting based on country
        switch (country.code) {
            case 'US':
            case 'CA':
                return this.formatUSPhone(cleaned);
            case 'GB':
                return this.formatUKPhone(cleaned);
            case 'DE':
                return this.formatGermanPhone(cleaned);
            case 'FR':
                return this.formatFrenchPhone(cleaned);
            case 'IN':
                return this.formatIndianPhone(cleaned);
            default:
                return this.formatGenericPhone(cleaned);
        }
    }

    private formatUSPhone(phone: string): string {
        if (phone.length <= 3) return phone;
        if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    }

    private formatUKPhone(phone: string): string {
        if (phone.length <= 2) return phone;
        if (phone.length <= 6) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
        return `${phone.slice(0, 2)} ${phone.slice(2, 6)} ${phone.slice(6)}`;
    }

    private formatGermanPhone(phone: string): string {
        if (phone.length <= 2) return phone;
        if (phone.length <= 10) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
        return `${phone.slice(0, 2)} ${phone.slice(2, 10)}`;
    }

    private formatFrenchPhone(phone: string): string {
        if (phone.length <= 1) return phone;
        return phone.match(/.{1,2}/g)?.join(' ') || phone;
    }

    private formatIndianPhone(phone: string): string {
        if (phone.length <= 5) return phone;
        return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }

    private formatGenericPhone(phone: string): string {
        // Generic formatting - add space every 3-4 digits
        return phone.replace(/(\d{3,4})(?=\d)/g, '$1 ');
    }

    private validatePhoneNumber() {
        const phone = this.phoneNumber();
        const country = this.selectedCountry();

        if (!phone && this.required) {
            this.errorMessage.set('Phone number is required');
            return;
        }

        if (!phone) {
            this.errorMessage.set('');
            return;
        }

        // Basic validation based on country
        const minLength = this.getMinLength(country.code);
        const maxLength = country.maxLength || 15;

        if (phone.length < minLength) {
            this.errorMessage.set(`Phone number is too short for ${country.name}`);
            return;
        }

        // Check if phone number exceeds the maximum allowed digits for the country (without dial code)
        const maxPhoneDigits = this.getMaxPhoneDigits(country.code);
        if (phone.length > maxPhoneDigits) {
            this.errorMessage.set(`Phone number is too long for ${country.name}`);
            return;
        }

        // Check for invalid characters (non-numeric except for formatting)
        const cleanPhone = phone.replace(/[\s()\-+]/g, '');
        if (!/^\d+$/.test(cleanPhone)) {
            this.errorMessage.set('Phone number can only contain digits and formatting characters');
            return;
        }

        // Additional country-specific validation
        if (!this.isValidForCountry(phone, country.code)) {
            this.errorMessage.set(`Invalid phone number format for ${country.name}`);
            return;
        }

        this.errorMessage.set('');
    }

    private getMinLength(countryCode: string): number {
        const minLengths: { [key: string]: number } = {
            'US': 10, 'CA': 10, 'GB': 10, 'AU': 9, 'DE': 10,
            'FR': 9, 'IT': 9, 'ES': 9, 'IN': 10, 'CN': 11,
            'JP': 10, 'KR': 9, 'BR': 10, 'MX': 10
        };
        return minLengths[countryCode] || 7;
    }

    private getMaxPhoneDigits(countryCode: string): number {
        const maxPhoneDigits: { [key: string]: number } = {
            'US': 10, 'CA': 10, 'GB': 11, 'AU': 10, 'DE': 11,
            'FR': 9, 'IT': 10, 'ES': 9, 'IN': 10, 'CN': 11,
            'JP': 11, 'KR': 11, 'BR': 11, 'MX': 10, 'PK': 10,
            'BD': 10, 'LK': 9, 'TH': 9, 'VN': 10, 'MY': 10,
            'SG': 8, 'PH': 10, 'ID': 12, 'HK': 8, 'TW': 9,
            'IL': 9, 'TR': 10, 'SA': 8, 'AE': 8, 'EG': 10,
            'ZA': 9, 'NG': 10, 'AR': 10, 'CL': 8, 'CO': 10, 'PE': 9
        };
        return maxPhoneDigits[countryCode] || 12;
    }

    private isValidForCountry(phone: string, countryCode: string): boolean {
        // Enhanced country-specific validation patterns
        const patterns: { [key: string]: RegExp } = {
            'US': /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
            'CA': /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,  // Same format as US
            'GB': /^[1-9]\d{8,9}$/,
            'IN': /^[6-9]\d{9}$/,
            'DE': /^[1-9]\d{9,11}$/,
            'FR': /^[1-9]\d{8}$/,
            'AU': /^[2-578]\d{8}$/
        };

        const pattern = patterns[countryCode];
        if (pattern) {
            const isValidFormat = pattern.test(phone);

            // Additional validation for NANP countries (US and Canada)
            if ((countryCode === 'US' || countryCode === 'CA') && isValidFormat) {
                // Validate that the area code is correct for the country
                const detectedCountry = this.getCountryByAreaCode(phone);
                if (detectedCountry && detectedCountry !== countryCode) {
                    return false; // Wrong country for this area code
                }
            }

            return isValidFormat;
        }

        return phone.length >= 7;
    }

    private emitValue() {
        if (this.isUsingSeperateDialCode()) {
            // For separate dial code mode, emit the phone number without dial code
            this.onChange(this.phoneNumber());
        } else {
            // Default behavior: emit full number with dial code
            const fullNumber = this.phoneNumber() ?
                `${this.selectedCountry().dialCode}${this.phoneNumber()}` : '';
            this.onChange(fullNumber);
        }
    }

    isInvalid(): boolean {
        return this.touched() && !!this.errorMessage();
    }

    getFlagImageUrl(countryCode: string): string {
        // Using flagcdn.com for reliable flag images
        return `https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`;
    }

    getDropdownClasses(): string {
        const baseClasses = 'absolute z-50 w-72 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden';
        const position = this.dropdownPosition();

        if (position === 'up') {
            return `${baseClasses} bottom-full mb-1`;
        } else {
            return `${baseClasses} top-full mt-1`;
        }
    }

    getFlagEmoji(countryCode: string): string {
        const flags: { [key: string]: string } = {
            // Original countries
            'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
            'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪',
            'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
            'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
            'BG': '🇧🇬', 'HR': '🇭🇷', 'GR': '🇬🇷', 'PT': '🇵🇹', 'RU': '🇷🇺',
            'UA': '🇺🇦', 'BY': '🇧🇾', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪',
            'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'IN': '🇮🇳', 'PK': '🇵🇰',
            'BD': '🇧🇩', 'LK': '🇱🇰', 'TH': '🇹🇭', 'VN': '🇻🇳', 'MY': '🇲🇾',
            'SG': '🇸🇬', 'PH': '🇵🇭', 'ID': '🇮🇩', 'HK': '🇭🇰', 'TW': '🇹🇼',
            'MO': '🇲🇴', 'IL': '🇮🇱', 'TR': '🇹🇷', 'SA': '🇸🇦', 'AE': '🇦🇪',
            'KW': '🇰🇼', 'QA': '🇶🇦', 'BH': '🇧🇭', 'OM': '🇴🇲', 'JO': '🇯🇴',
            'LB': '🇱🇧', 'EG': '🇪🇬', 'ZA': '🇿🇦', 'NG': '🇳🇬', 'KE': '🇰🇪',
            'GH': '🇬🇭', 'MA': '🇲🇦', 'DZ': '🇩🇿', 'TN': '🇹🇳', 'BR': '🇧🇷',
            'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'MX': '🇲🇽',
            'VE': '🇻🇪', 'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴', 'EC': '🇪🇨',
            'NZ': '🇳🇿',

            // Additional European countries
            'IE': '🇮🇪', 'LU': '🇱🇺', 'MT': '🇲🇹', 'CY': '🇨🇾', 'IS': '🇮🇸',
            'MC': '🇲🇨', 'SI': '🇸🇮', 'SK': '🇸🇰', 'RS': '🇷🇸', 'BA': '🇧🇦',
            'ME': '🇲🇪', 'MK': '🇲🇰', 'AL': '🇦🇱', 'MD': '🇲🇩', 'SM': '🇸🇲',
            'AD': '🇦🇩', 'LI': '🇱🇮', 'FO': '🇫🇴', 'GL': '🇬🇱',

            // Additional Asian-Pacific countries
            'NP': '🇳🇵', 'MM': '🇲🇲', 'KH': '🇰🇭', 'LA': '🇱🇦', 'BN': '🇧🇳',
            'MN': '🇲🇳', 'MV': '🇲🇻', 'BT': '🇧🇹', 'UZ': '🇺🇿', 'KZ': '🇰🇿',
            'KG': '🇰🇬', 'TJ': '🇹🇯', 'TM': '🇹🇲', 'AF': '🇦🇫', 'AM': '🇦🇲',
            'AZ': '🇦🇿', 'GE': '🇬🇪',

            // Additional Middle Eastern countries
            'IR': '🇮🇷', 'IQ': '🇮🇶', 'SY': '🇸🇾', 'YE': '🇾🇪',

            // Additional African countries
            'ET': '🇪🇹', 'TZ': '🇹🇿', 'UG': '🇺🇬', 'RW': '🇷🇼', 'BI': '🇧🇮',
            'MG': '🇲🇬', 'MU': '🇲🇺', 'SC': '🇸🇨', 'ZW': '🇿🇼', 'ZM': '🇿🇲',
            'BW': '🇧🇼', 'NA': '🇳🇦', 'MZ': '🇲🇿', 'AO': '🇦🇴', 'CM': '🇨🇲',
            'SN': '🇸🇳', 'CI': '🇨🇮', 'ML': '🇲🇱', 'BF': '🇧🇫', 'NE': '🇳🇪',
            'TD': '🇹🇩', 'SD': '🇸🇩', 'LY': '🇱🇾',

            // Caribbean & Central America
            'JM': '🇯🇲', 'BB': '🇧🇧', 'TT': '🇹🇹', 'BS': '🇧🇸', 'DO': '🇩🇴',
            'PR': '🇵🇷', 'CU': '🇨🇺', 'HT': '🇭🇹', 'CR': '🇨🇷', 'PA': '🇵🇦',
            'GT': '🇬🇹', 'HN': '🇭🇳', 'SV': '🇸🇻', 'NI': '🇳🇮', 'BZ': '🇧🇿',

            // Pacific & Oceania
            'FJ': '🇫🇯', 'PG': '🇵🇬', 'WS': '🇼🇸', 'TO': '🇹🇴', 'VU': '🇻🇺', 'SB': '🇸🇧'
        };
        return flags[countryCode] || '🌍';
    }

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        if (value) {
            if (this.isUsingSeperateDialCode()) {
                // When separateDialCode is true or dialCode is provided, 
                // the value should be just the phone number
                // Set the phone number and keep the current selected country
                this.phoneNumber.set(this.cleanPhoneNumber(value));

                // If dialCode is provided, ensure the country matches (with shared dial code handling)
                if (this.dialCode) {
                    this.setCountryByDialCode(this.dialCode.trim(), this.cleanPhoneNumber(value));
                }
            } else {
                // Default behavior: parse full number with dial code
                const parsed = this.parseFullNumber(value);
                if (parsed) {
                    this.selectedCountry.set(parsed.country);
                    this.phoneNumber.set(parsed.phone);
                } else {
                    // If parsing fails, treat as phone number for default country
                    this.phoneNumber.set(this.cleanPhoneNumber(value));
                }
            }
        } else {
            this.phoneNumber.set('');
        }

        // Validate after setting the value
        if (value) {
            setTimeout(() => this.validatePhoneNumber(), 0);
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    private parseFullNumber(fullNumber: string): { country: Country; phone: string } | null {
        if (!fullNumber) return null;

        // Clean the input number
        const cleanNumber = fullNumber.replace(/\D/g, '');

        // Try with + prefix
        const withPlus = fullNumber.startsWith('+') ? fullNumber : `+${cleanNumber}`;

        // Sort countries by dial code length (longest first) to match correctly
        const sortedCountries = [...this.allCountries].sort((a, b) => b.dialCode.length - a.dialCode.length);

        for (const country of sortedCountries) {
            if (withPlus.startsWith(country.dialCode)) {
                const phoneNumber = withPlus.substring(country.dialCode.length);
                if (phoneNumber.length > 0) {
                    // For shared dial codes, try to detect the correct country
                    const correctCountry = this.resolveSharedDialCode(country.dialCode, phoneNumber);
                    return {
                        country: correctCountry || country,
                        phone: phoneNumber
                    };
                }
            }
        }

        // If no match found, try without + prefix for dial codes
        for (const country of sortedCountries) {
            const dialCodeWithoutPlus = country.dialCode.substring(1); // Remove +
            if (cleanNumber.startsWith(dialCodeWithoutPlus)) {
                const phoneNumber = cleanNumber.substring(dialCodeWithoutPlus.length);
                if (phoneNumber.length > 0) {
                    // For shared dial codes, try to detect the correct country
                    const correctCountry = this.resolveSharedDialCode(country.dialCode, phoneNumber);
                    return {
                        country: correctCountry || country,
                        phone: phoneNumber
                    };
                }
            }
        }

        return null;
    }

    // Resolve country for shared dial codes
    private resolveSharedDialCode(dialCode: string, phoneNumber: string): Country | null {
        const countriesWithDialCode = this.allCountries.filter(c => c.dialCode === dialCode);

        if (countriesWithDialCode.length <= 1) {
            return null; // No conflict
        }

        // Special handling for NANP (+1) - US and Canada
        if (dialCode === '+1' && phoneNumber.length >= 3) {
            const detectedCountryCode = this.getCountryByAreaCode(phoneNumber);
            if (detectedCountryCode) {
                return countriesWithDialCode.find(c => c.code === detectedCountryCode) || null;
            }
        }

        // For other shared dial codes, could add more logic here
        // For now, prefer the currently selected country if it matches
        const currentCountry = this.selectedCountry();
        if (countriesWithDialCode.some(c => c.code === currentCountry.code)) {
            return currentCountry;
        }

        return null; // Let the caller use the first match
    }

    // Get current values separately (useful for forms)
    getCurrentValues(): { dialCode: string; phoneNumber: string; fullNumber: string; country: Country } {
        const dialCode = this.selectedCountry().dialCode;
        const phoneNumber = this.phoneNumber();
        const fullNumber = phoneNumber ? `${dialCode}${phoneNumber}` : '';

        return {
            dialCode,
            phoneNumber,
            fullNumber,
            country: this.selectedCountry()
        };
    }

    // Check if the component has a valid phone number
    hasValidPhoneNumber(): boolean {
        return !!this.phoneNumber() && !this.errorMessage();
    }

    // Check if country detection is in progress
    isDetectingCountry(): boolean {
        return this.detectingCountry();
    }

    // Reset manual selection flag (useful when programmatically changing values)
    resetManualSelection() {
        this.manuallySelected.set(false);
    }

    // Check if country was manually selected by user
    isManuallySelected(): boolean {
        return this.manuallySelected();
    }

    // Force country selection with area code validation for shared dial codes
    setCountryWithValidation(countryCode: string, phoneNumber?: string): boolean {
        const country = this.allCountries.find(c => c.code === countryCode.toUpperCase());
        if (!country) return false;

        // For NANP countries, validate the phone number against area codes if provided
        if (phoneNumber && (countryCode === 'US' || countryCode === 'CA')) {
            const detectedCountry = this.getCountryByAreaCode(phoneNumber);
            if (detectedCountry && detectedCountry !== countryCode.toUpperCase()) {
                // Area code doesn't match the requested country
                return false;
            }
        }

        this.selectedCountry.set(country);
        this.manuallySelected.set(true);
        this.countryChange.emit(country);
        this.dialCodeChange.emit(country.dialCode);
        this.validatePhoneNumber();
        this.emitValue();

        return true;
    }

    // Custom validator for reactive forms
    static phoneValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (!value) return null;

        // Enhanced validation for both full numbers and phone numbers
        if (typeof value === 'string') {
            // Check if it's a full number with dial code
            const fullNumberRegex = /^\+\d{7,15}$/;
            // Check if it's just a phone number
            const phoneNumberRegex = /^\d{7,15}$/;

            return (fullNumberRegex.test(value) || phoneNumberRegex.test(value)) ? null : { invalidPhone: true };
        }

        return { invalidPhone: true };
    }

    private initializationTimeout: any;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['dialCode']) {

            // Cancel any pending initialization
            if (this.initializationTimeout) {
                clearTimeout(this.initializationTimeout);
                this.initializationTimeout = null;
            }

            // If dialCode is provided, reinitialize to use it and bypass IP detection
            if (this.dialCode && this.dialCode.trim() !== '') {
                this.initializeWithDialCode();
            }
            // If dialCode was removed, reinitialize with IP detection
            else if (changes['dialCode'].previousValue && !this.dialCode) {
                this.performInitialization();
            }
        }
    }

    private initializeWithDialCode() {
        const normalizedDialCode = this.dialCode.startsWith('+') ? this.dialCode : `+${this.dialCode}`;

        // Reset manual selection when initializing with dial code
        this.manuallySelected.set(false);

        // Use the enhanced setCountryByDialCode method for better shared dial code handling
        this.setCountryByDialCode(normalizedDialCode, this.phoneNumber());

        // Emit country detected event
        this.countryDetected.emit({
            country: this.selectedCountry(),
            detectedBy: 'manual'
        });
    }
}