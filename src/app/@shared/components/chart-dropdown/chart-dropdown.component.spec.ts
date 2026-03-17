import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartDropdownComponent } from './chart-dropdown.component';

describe('ChartDropdownComponent', () => {
  let component: ChartDropdownComponent;
  let fixture: ComponentFixture<ChartDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
