export const upgradeConfig = [
  {
    type: 'contratar',
    order: 0,
    icon: 'assets/images/icon-bee.png',
    costIcon: 'assets/images/icon-polen.png',
    name: 'Hire Bee',
    description: 'Generates 1 pollen/s',
    costResource: 'pollen',
    showAmount: true,
    levelReq: null
  },
  {
    type: 'produccion',
    order: 1,
    icon: 'assets/images/icon-production.png',
    costIcon: 'assets/images/icon-nectar.png',
    name: 'Improve Production',
    description: '+<span data-value></span>% / bee',
    costResource: 'nectar',
    showAmount: false,
    levelReq: 2
  },
  {
    type: 'avispa',
    order: 2,
    icon: 'assets/images/icon-wasp.png',
    costIcon: 'assets/images/icon-polen.png',
    name: 'Hire Wasp',
    description: 'Generates 1.5 pollen/s',
    costResource: 'pollen',
    showAmount: true,
    levelReq: 4
  },
  {
    type: 'mejorar-colmena',
    order: 3,
    icon: 'assets/images/icon-energy.png',
    costIcon: 'assets/images/icon-nectar.png',
    name: 'Improve Hive',
    description: '+<span data-value></span>% speed',
    costResource: 'nectar',
    showAmount: false,
    levelReq: 8
  },
  {
    type: 'pato',
    order: 4,
    icon: 'assets/images/icon-polen.png',
    costIcon: 'assets/images/icon-polen.png',
    name: 'Hire Duck',
    description: 'Generates 2 pollen/s',
    costResource: 'pollen',
    showAmount: true,
    levelReq: 10
  },
  {
    type: 'conejo',
    order: 5,
    icon: 'assets/images/icon-nectar.png',
    costIcon: 'assets/images/icon-polen.png',
    name: 'Hire Rabbit',
    description: 'Generates 1 nectar/s',
    costResource: 'pollen',
    showAmount: true,
    levelReq: 12
  }
];
