import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MultiselectComponent, MultiselectOption } from './multiselect.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multiselect-example',
  standalone: true,
  imports: [MultiselectComponent, ReactiveFormsModule, FormsModule, CommonModule],
  template: `
    <div class="example-container">
      <h2>Multiselect Examples with Different Option Formats</h2>
      
      <!-- Example 1: Simple string array -->
      <div class="example-section">
        <h3>1. Simple String Array</h3>
        <div class="form-group">
          <label>Select Names (String Array):</label>
          <multiselect
            [(ngModel)]="selectedNames"
            [options]="nameOptions"
            placeholder="Select names..."
            [allowCustomText]="true"
            customTextPlaceholder="Add custom name..."
            [maxSelections]="5"
            (selectionChange)="onNamesChange($event)"
            (customTextAdded)="onCustomNameAdded($event)">
          </multiselect>
        </div>
        
        <div class="form-values">
          <h4>Selected Names:</h4>
          <pre>{{ selectedNames | json }}</pre>
        </div>
      </div>
      
      <!-- Example 2: Objects with id and label -->
      <div class="example-section">
        <h3>2. Objects with id and label</h3>
        <div class="form-group">
          <label>Select Skills (id/label objects):</label>
          <multiselect
            [(ngModel)]="selectedSkills"
            [options]="skillOptions"
            placeholder="Select skills..."
            [allowCustomText]="true"
            customTextPlaceholder="Add custom skill..."
            [maxSelections]="3"
            (selectionChange)="onSkillsChange($event)"
            (customTextAdded)="onCustomSkillAdded($event)">
          </multiselect>
        </div>
        
        <div class="form-values">
          <h4>Selected Skills:</h4>
          <pre>{{ selectedSkills | json }}</pre>
        </div>
      </div>
      
      <!-- Example 3: Objects with id and name -->
      <div class="example-section">
        <h3>3. Objects with id and name</h3>
        <div class="form-group">
          <label>Select Technologies (id/name objects):</label>
          <multiselect
            [(ngModel)]="selectedTechnologies"
            [options]="techOptions"
            placeholder="Select technologies..."
            [allowCustomText]="false"
            [maxSelections]="4"
            chipClass="tech-chip"
            (selectionChange)="onTechnologiesChange($event)">
          </multiselect>
        </div>
        
        <div class="form-values">
          <h4>Selected Technologies:</h4>
          <pre>{{ selectedTechnologies | json }}</pre>
        </div>
      </div>
      
      <!-- Example 4: Mixed array with different formats -->
      <div class="example-section">
        <h3>4. Mixed Array (Strings + Objects)</h3>
        <div class="form-group">
          <label>Select Items (Mixed formats):</label>
          <multiselect
            [(ngModel)]="selectedMixed"
            [options]="mixedOptions"
            placeholder="Select items..."
            [allowCustomText]="true"
            customTextPlaceholder="Add custom item..."
            [maxSelections]="6"
            (selectionChange)="onMixedChange($event)"
            (customTextAdded)="onCustomMixedAdded($event)">
          </multiselect>
        </div>
        
        <div class="form-values">
          <h4>Selected Mixed Items:</h4>
          <pre>{{ selectedMixed | json }}</pre>
        </div>
      </div>
      
      <!-- Example 5: Reactive Form with different formats -->
      <div class="example-section">
        <h3>5. Reactive Form Example</h3>
        <form [formGroup]="reactiveForm" (ngSubmit)="onReactiveSubmit()">
          <div class="form-group">
            <label>Languages (String Array):</label>
            <multiselect
              formControlName="languages"
              [options]="languageOptions"
              placeholder="Select languages..."
              [required]="true"
              requiredMessage="Please select at least one language"
              [minSelections]="1"
              [maxSelections]="5">
            </multiselect>
          </div>
          
          <div class="form-group">
            <label>Frameworks (id/label objects):</label>
            <multiselect
              formControlName="frameworks"
              [options]="frameworkOptions"
              placeholder="Select frameworks..."
              [allowCustomText]="true"
              customTextPlaceholder="Add custom framework..."
              [maxSelections]="3">
            </multiselect>
          </div>
          
          <div class="form-group">
            <label>Tools (id/name objects):</label>
            <multiselect
              formControlName="tools"
              [options]="toolOptions"
              placeholder="Select tools..."
              [allowCustomText]="false"
              [maxSelections]="4">
            </multiselect>
          </div>
          
          <button type="submit" [disabled]="!reactiveForm.valid">Submit Form</button>
        </form>
        
        <div class="form-values">
          <h4>Form Values:</h4>
          <pre>{{ reactiveForm.value | json }}</pre>
        </div>
      </div>
      
      <!-- Example 6: Objects with custom value property -->
      <div class="example-section">
        <h3>6. Objects with Custom Value Property</h3>
        <div class="form-group">
          <label>Select Countries (custom value):</label>
          <multiselect
            [(ngModel)]="selectedCountries"
            [options]="countryOptions"
            placeholder="Select countries..."
            [allowCustomText]="true"
            customTextPlaceholder="Add custom country..."
            [maxSelections]="5"
            (selectionChange)="onCountriesChange($event)">
          </multiselect>
        </div>
        
        <div class="form-values">
          <h4>Selected Countries:</h4>
          <pre>{{ selectedCountries | json }}</pre>
        </div>
      </div>
      
      <!-- Example 7: Direct Input and Comma Separated -->
      <div class="example-section">
        <h3>7. Direct Input & Comma Separated Values</h3>
        <div class="form-group">
          <label>Direct Input Mode (Press Tab to switch):</label>
          <multiselect
            [(ngModel)]="directInputSelection"
            [options]="directInputOptions"
            placeholder="Type directly or press Tab to open dropdown..."
            [allowCustomText]="true"
            [allowCommaSeparated]="true"
            customTextPlaceholder="Type items separated by commas..."
            [maxSelections]="10"
            (selectionChange)="onDirectInputChange($event)"
            (customTextAdded)="onDirectInputCustomAdded($event)">
          </multiselect>
          <small class="text-gray-600 dark:text-gray-400 mt-1 block">
            💡 Press Tab to switch between direct input and dropdown mode. Type comma-separated values like "item1, item2, item3"
          </small>
      </div>
      
        <div class="form-values">
          <h4>Direct Input Selection:</h4>
          <pre>{{ directInputSelection | json }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .example-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .example-section {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background-color: #f9fafb;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
    }
    
    .form-values {
      margin-top: 20px;
      padding: 15px;
      background-color: #f3f4f6;
      border-radius: 6px;
    }
    
    .form-values pre {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    
    button {
      padding: 10px 20px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    
    button:hover:not(:disabled) {
      background-color: #2563eb;
    }
    
    button:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
    
    /* Custom styling examples */
    .custom-chip {
      background-color: #fef3c7 !important;
      color: #92400e !important;
      border: 1px solid #f59e0b !important;
    }
    
    .custom-dropdown {
      border-color: #f59e0b !important;
    }
    
    .custom-input {
      color: #92400e !important;
    }
    
    .tech-chip {
      background-color: #dbeafe !important;
      color: #1e40af !important;
      border: 1px solid #3b82f6 !important;
    }
  `]
})
export class MultiselectExampleComponent {
  reactiveForm: FormGroup;
  selectedNames: string[] = [];
  selectedSkills: any[] = [];
  selectedTechnologies: any[] = [];
  selectedMixed: any[] = [];
  selectedCountries: any[] = [];
  directInputSelection: any[] = [];

  // Sample options
  nameOptions: string[] = ['Ramesh', 'Shyam', 'John', 'Jane', 'Mike', 'Sarah'];

  skillOptions: MultiselectOption[] = [
    { id: 1, label: 'JavaScript', value: 'javascript' },
    { id: 2, label: 'TypeScript', value: 'typescript' },
    { id: 3, label: 'Angular', value: 'angular' },
    { id: 4, label: 'React', value: 'react' },
    { id: 5, label: 'Vue.js', value: 'vue' },
    { id: 6, label: 'Node.js', value: 'nodejs' },
    { id: 7, label: 'Python', value: 'python' },
    { id: 8, label: 'Java', value: 'java' },
    { id: 9, label: 'C#', value: 'csharp' },
    { id: 10, label: 'PHP', value: 'php' }
  ];

  techOptions: MultiselectOption[] = [
    { id: 1, name: 'Docker', value: 'docker' },
    { id: 2, name: 'Kubernetes', value: 'kubernetes' },
    { id: 3, name: 'AWS', value: 'aws' },
    { id: 4, name: 'Azure', value: 'azure' },
    { id: 5, name: 'Google Cloud', value: 'gcp' },
    { id: 6, name: 'MongoDB', value: 'mongodb' },
    { id: 7, name: 'PostgreSQL', value: 'postgresql' },
    { id: 8, name: 'Redis', value: 'redis' }
  ];

  languageOptions: string[] = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

  mixedOptions: MultiselectOption[] = [
    'Simple String',
    'Another String',
    { id: 1, label: 'Object with label' },
    { id: 2, name: 'Object with name' },
    { id: 3, label: 'Object with custom value', value: 'custom-value' },
    'More strings',
    { id: 4, name: 'Another object', disabled: true }
  ];

  frameworkOptions: MultiselectOption[] = [
    { id: 1, label: 'Angular', value: 'angular' },
    { id: 2, label: 'React', value: 'react' },
    { id: 3, label: 'Vue.js', value: 'vue' },
    { id: 4, label: 'Svelte', value: 'svelte' }
  ];

  toolOptions: MultiselectOption[] = [
    { id: 1, name: 'VS Code', value: 'vscode' },
    { id: 2, name: 'WebStorm', value: 'webstorm' },
    { id: 3, name: 'Git', value: 'git' },
    { id: 4, name: 'Docker', value: 'docker' },
    { id: 5, name: 'Postman', value: 'postman' }
  ];

  countryOptions: MultiselectOption[] = [
    { id: 1, label: 'United States', value: 'US' },
    { id: 2, label: 'United Kingdom', value: 'UK' },
    { id: 3, label: 'Canada', value: 'CA' },
    { id: 4, label: 'Australia', value: 'AU' },
    { id: 5, label: 'Germany', value: 'DE' },
    { id: 6, label: 'France', value: 'FR' },
    { id: 7, label: 'Japan', value: 'JP' },
    { id: 8, label: 'India', value: 'IN' }
  ];

  directInputOptions: MultiselectOption[] = [
    'Quick Add',
    'Fast Entry',
    'Direct Input',
    { id: 1, label: 'Predefined Option 1' },
    { id: 2, label: 'Predefined Option 2' },
    { id: 3, name: 'Another Option' }
  ];

  constructor(private readonly fb: FormBuilder) {
    this.reactiveForm = this.fb.group({
      languages: [[], [Validators.required, Validators.minLength(1)]],
      frameworks: [[], [Validators.maxLength(3)]],
      tools: [[], [Validators.maxLength(4)]]
    });
  }

  onNamesChange(names: string[]) {
    console.log('Names changed:', names);
  }

  onCustomNameAdded(name: string) {
    console.log('Custom name added:', name);
  }

  onSkillsChange(skills: any[]) {
    console.log('Skills changed:', skills);
  }

  onCustomSkillAdded(skill: string) {
    console.log('Custom skill added:', skill);
  }

  onTechnologiesChange(technologies: any[]) {
    console.log('Technologies changed:', technologies);
  }

  onMixedChange(items: any[]) {
    console.log('Mixed items changed:', items);
  }

  onCustomMixedAdded(item: string) {
    console.log('Custom mixed item added:', item);
  }

  onCountriesChange(countries: any[]) {
    console.log('Countries changed:', countries);
  }

  onReactiveSubmit() {
    if (this.reactiveForm.valid) {
      console.log('Reactive form submitted:', this.reactiveForm.value);
    }
  }

  onDirectInputChange(items: any[]) {
    console.log('Direct input selection changed:', items);
  }

  onDirectInputCustomAdded(item: string) {
    console.log('Direct input custom item added:', item);
  }
} 