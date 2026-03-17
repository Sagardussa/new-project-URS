import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartHeadingComponent } from './chart-heading.component';

describe('ChartHeadingComponent', () => {
  let component: ChartHeadingComponent;
  let fixture: ComponentFixture<ChartHeadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartHeadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartHeadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
