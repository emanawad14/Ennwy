import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicRangeComponent } from './dynamic-range.component';

describe('DynamicRangeComponent', () => {
  let component: DynamicRangeComponent;
  let fixture: ComponentFixture<DynamicRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicRangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
