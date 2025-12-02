import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownMultiSelectComponent } from './dropdown-multi-select.component';

describe('DropdownMultiSelectComponent', () => {
  let component: DropdownMultiSelectComponent;
  let fixture: ComponentFixture<DropdownMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownMultiSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
