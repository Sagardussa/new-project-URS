import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportBtnComponent } from './export-btn.component';

describe('ExportBtnComponent', () => {
  let component: ExportBtnComponent;
  let fixture: ComponentFixture<ExportBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportBtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
