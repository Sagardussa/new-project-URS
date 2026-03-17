import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedService, AlertService } from '@core';


@Component({
    selector: 'app-export-btn',
    imports: [CommonModule],
    templateUrl: './export-btn.component.html',
    styleUrl: './export-btn.component.css'
})
export class ExportBtnComponent{
  @Output() export = new EventEmitter<void>();
  exportSuccessDialog:boolean =false;
  showAlertDialog:boolean=false;
  constructor(private readonly sharedService:SharedService,private readonly alertService:AlertService){}
  exportFile(){
    this.export.emit();
  }
}
