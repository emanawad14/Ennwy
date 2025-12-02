import { Component } from '@angular/core';
import { DropdownComponent } from '../../post-ad/sell-ad/dynamic-fields/dropdown/dropdown.component';
import { BedsComponent } from './beds/beds.component';
import { AreaComponent } from './area/area.component';

@Component({
  selector: 'app-search-properties',
  imports: [DropdownComponent, BedsComponent, AreaComponent],
  templateUrl: './search-properties.component.html',
  styleUrl: './search-properties.component.scss'
})
export class SearchPropertiesComponent {

}
