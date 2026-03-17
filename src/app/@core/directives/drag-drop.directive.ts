import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appDragDrop]',
  standalone: true
})
export class DragDropDirective {

  constructor() { }

  @Output() fileDropped = new EventEmitter<FileList>(); // Emits the dropped files

  // Highlight the drop zone when dragging files over it
  @HostBinding('class.file-over') fileOver: boolean = false;

  // Listen for dragover event
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = true;
  }

  // Listen for dragleave event
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = false;
  }

  // Listen for drop event
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.fileDropped.emit(event.dataTransfer.files); // Emit the files
      event.dataTransfer.clearData();
    }
  }
}
