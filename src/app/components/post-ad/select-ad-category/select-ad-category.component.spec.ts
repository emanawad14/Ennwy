import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAdCategoryComponent } from './select-ad-category.component';

describe('SelectAdCategoryComponent', () => {
  let component: SelectAdCategoryComponent;
  let fixture: ComponentFixture<SelectAdCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectAdCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectAdCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
