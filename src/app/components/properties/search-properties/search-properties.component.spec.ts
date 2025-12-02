import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPropertiesComponent } from './search-properties.component';

describe('SearchPropertiesComponent', () => {
  let component: SearchPropertiesComponent;
  let fixture: ComponentFixture<SearchPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
