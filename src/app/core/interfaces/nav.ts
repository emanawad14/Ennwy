export interface ILink {
  "id": number,
  "name": string,
  "name_L1": string,
  "slug": string,
  "level": number,
  "parentId": null | number,
  "displayPriority": number,
  "displayPriorityInFirst": number,
  "purpose": null | string,
  "rolesString": string,
  "rolesArray": string[],
  "configurations": null | string,
  "paaSections": null | string,
  "isActive": boolean,
  "children": ILinkChild[]
}

export interface ILinkChild {
  "id": number,
  "name": string,
  "name_L1": string,
  "slug": string,
  "level": number,
  "parentId": number,
  "displayPriority": number,
  "displayPriorityInFirst": number,
  "purpose": null,
  "rolesString": string,
  "rolesArray": [],
  "configurations": null | string,
  "paaSections": null | string,
  "isActive": boolean,
  "children": []
}
