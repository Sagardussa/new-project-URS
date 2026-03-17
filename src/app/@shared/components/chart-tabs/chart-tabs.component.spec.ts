import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartTabsComponent } from './chart-tabs.component';

describe('ChartTabsComponent', () => {
  let component: ChartTabsComponent;
  let fixture: ComponentFixture<ChartTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
