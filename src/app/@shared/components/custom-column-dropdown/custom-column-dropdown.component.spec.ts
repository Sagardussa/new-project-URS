import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomColumnDropdownComponent } from './custom-column-dropdown.component';

describe('CustomColumnDropdownComponent', () => {
  let component: CustomColumnDropdownComponent;
  let fixture: ComponentFixture<CustomColumnDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomColumnDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomColumnDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
