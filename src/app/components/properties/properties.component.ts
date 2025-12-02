import { Component, signal } from '@angular/core';
import { SearchPropertiesComponent } from './search-properties/search-properties.component';
import { ProductCardComponent } from '../home/product-card/product-card.component';
import { CarouselComponent } from '../../shared/components/carousel/carousel.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-properties',
  imports: [SearchPropertiesComponent, ProductCardComponent, CarouselComponent, CommonModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss'
})
export class PropertiesComponent {
  listing = signal<any>([
    {
      "id": 10672,
      "adsNumber": "AD250500010672",
      "activStatus": true,
      "price": 396,
      "purpose": "for-sale",
      "priceInUSD": 40,
      "title": "قارئ باركود لاسلكي",
      "title_L1": "قارئ باركود لاسلكي",
      "description": "شحن بكبل usb",
      "description_L1": "شحن بكبل usb",
      "slug": null,
      "slug_L1": null,
      "keywords": null,
      "locationName": "دمشق , ",
      "locationName_L1": "Damascus , ",
      "advertisementStatus": 2,
      "created": null,
      "approvedDateTime": "22-05-2025 22:37:45",
      "contactMethod": 1,
      "photos": [
        "https://ennwy.com:8007/Files/e799e5fc-9f08-4809-a457-04443bdaff60.jpg"
      ],
      "flatFields": [],
      "userDisplayName": "frooh alwadi",
      "userPhoto": "https://ennwy.com:8007/Files/",
      "userId": "3345c4c3-55d8-43cb-a113-52ff2ae344bd",
      "userCreateData": "06-05-2025 12:55:57",
      "isFavorite": false,
      "isNegotiable": false,
      "rejectReson": null,
      "platform": null,
      "appVersion": null,
      "longitude": null,
      "latitude": null,
      "addressDetails": null,
      "cityId": null,
      "districtId": null,
      "rating": 0,
      "sold": false
    },
    {
      "id": 10603,
      "adsNumber": "AD250500010603",
      "activStatus": true,
      "price": 600000,
      "purpose": "for-sale",
      "priceInUSD": 60,
      "title": "طبات انترنت",
      "title_L1": "طبات انترنت",
      "description": "الطيحة",
      "description_L1": "الطيحة",
      "slug": null,
      "slug_L1": null,
      "keywords": null,
      "locationName": "درعا , ",
      "locationName_L1": "Dar'a , ",
      "advertisementStatus": 2,
      "created": null,
      "approvedDateTime": "22-05-2025 20:16:41",
      "contactMethod": 0,
      "photos": [
        "https://ennwy.com:8007/Files/8fff9c70-dac4-4f72-a58e-0f50e4ad56c2.jpg"
      ],
      "flatFields": [],
      "userDisplayName": "وحيد للاتصالات ",
      "userPhoto": "https://ennwy.com:8007/Files/",
      "userId": "69c9e56d-7179-43f3-bb7f-011c26a26e0a",
      "userCreateData": "08-05-2025 17:35:52",
      "isFavorite": false,
      "isNegotiable": false,
      "rejectReson": null,
      "platform": null,
      "appVersion": null,
      "longitude": null,
      "latitude": null,
      "addressDetails": null,
      "cityId": null,
      "districtId": null,
      "rating": 0,
      "sold": false
    },
    {
      "id": 10600,
      "adsNumber": "AD250500010600",
      "activStatus": true,
      "price": 200000,
      "purpose": "for-sale",
      "priceInUSD": 20,
      "title": "راوتر نيتس",
      "title_L1": "راوتر نيتس",
      "description": "الطيحة",
      "description_L1": "الطيحة",
      "slug": null,
      "slug_L1": null,
      "keywords": null,
      "locationName": "درعا , ",
      "locationName_L1": "Dar'a , ",
      "advertisementStatus": 2,
      "created": null,
      "approvedDateTime": "22-05-2025 20:16:25",
      "contactMethod": 0,
      "photos": [
        "https://ennwy.com:8007/Files/e384e830-aff0-4366-9574-052cf37133eb.jpg"
      ],
      "flatFields": [],
      "userDisplayName": "وحيد للاتصالات ",
      "userPhoto": "https://ennwy.com:8007/Files/",
      "userId": "69c9e56d-7179-43f3-bb7f-011c26a26e0a",
      "userCreateData": "08-05-2025 17:35:52",
      "isFavorite": false,
      "isNegotiable": false,
      "rejectReson": null,
      "platform": null,
      "appVersion": null,
      "longitude": null,
      "latitude": null,
      "addressDetails": null,
      "cityId": null,
      "districtId": null,
      "rating": 0,
      "sold": false
    }
  ]);

  products = [
    { name: 'Laptop', price: '$1000', image: 'laptop.jpg' },
    { name: 'Phone', price: '$600', image: 'phone.jpg' },
    { name: 'Watch', price: '$250', image: 'watch.jpg' }
  ];

}
