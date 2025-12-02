import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdOwnerCardComponent } from './ad-owner-card.component';

describe('AdOwnerCardComponent', () => {
  let component: AdOwnerCardComponent;
  let fixture: ComponentFixture<AdOwnerCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdOwnerCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdOwnerCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
