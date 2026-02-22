// Preset cost-of-living data for popular affordable cities
// All amounts are monthly NZD estimates for a family of 4 (2 adults, 2 kids)

export const CITY_PRESETS = [
  {
    name: 'Da Nang',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 1500 },
      ],
      utilities: [
        { name: 'Electricity', amount: 60 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 30 },
        { name: 'Phone (2 plans)', amount: 20 },
      ],
      food: [
        { name: 'Groceries', amount: 500 },
        { name: 'Dining out', amount: 200 },
      ],
      transport: [
        { name: 'Motorbike / Grab', amount: 80 },
      ],
      education: [
        { name: 'Homeschool / Online', amount: 200 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 150 },
        { name: 'Clinic visits', amount: 50 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 30 },
        { name: 'Entertainment', amount: 100 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Chiang Mai',
    costs: {
      housing: [
        { name: 'Rent (3-bed house)', amount: 1400 },
      ],
      utilities: [
        { name: 'Electricity', amount: 80 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 35 },
        { name: 'Phone (2 plans)', amount: 25 },
      ],
      food: [
        { name: 'Groceries', amount: 550 },
        { name: 'Dining out', amount: 250 },
      ],
      transport: [
        { name: 'Scooter / Songthaew', amount: 70 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 900 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 200 },
        { name: 'Doctor visits', amount: 40 },
      ],
      lifestyle: [
        { name: 'Gym / pool', amount: 50 },
        { name: 'Entertainment', amount: 100 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Lisbon',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 3200 },
      ],
      utilities: [
        { name: 'Electricity & gas', amount: 160 },
        { name: 'Water', amount: 40 },
        { name: 'Internet', amount: 55 },
        { name: 'Phone (2 plans)', amount: 45 },
      ],
      food: [
        { name: 'Groceries', amount: 800 },
        { name: 'Dining out', amount: 300 },
      ],
      transport: [
        { name: 'Metro / bus passes', amount: 120 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 2000 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 350 },
        { name: 'GP visits', amount: 60 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 70 },
        { name: 'Entertainment', amount: 150 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Medellín',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 1800 },
      ],
      utilities: [
        { name: 'Electricity & gas', amount: 80 },
        { name: 'Water', amount: 25 },
        { name: 'Internet', amount: 40 },
        { name: 'Phone (2 plans)', amount: 25 },
      ],
      food: [
        { name: 'Groceries', amount: 550 },
        { name: 'Dining out', amount: 200 },
      ],
      transport: [
        { name: 'Metro / taxi', amount: 80 },
      ],
      education: [
        { name: 'Bilingual school (2 kids)', amount: 1200 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 250 },
        { name: 'Doctor visits', amount: 40 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 40 },
        { name: 'Entertainment', amount: 120 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Bali (Canggu)',
    costs: {
      housing: [
        { name: 'Rent (3-bed villa)', amount: 2200 },
      ],
      utilities: [
        { name: 'Electricity', amount: 70 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 40 },
        { name: 'Phone (2 plans)', amount: 20 },
      ],
      food: [
        { name: 'Groceries', amount: 600 },
        { name: 'Dining out', amount: 350 },
      ],
      transport: [
        { name: 'Scooter rental & fuel', amount: 100 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 1800 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 200 },
        { name: 'Clinic visits', amount: 40 },
      ],
      lifestyle: [
        { name: 'Gym / yoga', amount: 60 },
        { name: 'Entertainment', amount: 150 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Kuala Lumpur',
    costs: {
      housing: [
        { name: 'Rent (3-bed condo)', amount: 1600 },
      ],
      utilities: [
        { name: 'Electricity', amount: 70 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 45 },
        { name: 'Phone (2 plans)', amount: 30 },
      ],
      food: [
        { name: 'Groceries', amount: 550 },
        { name: 'Dining out', amount: 250 },
      ],
      transport: [
        { name: 'MRT / Grab', amount: 100 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 1600 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 250 },
        { name: 'Doctor visits', amount: 40 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 50 },
        { name: 'Entertainment', amount: 120 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Mexico City',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 2400 },
      ],
      utilities: [
        { name: 'Electricity & gas', amount: 60 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 45 },
        { name: 'Phone (2 plans)', amount: 30 },
      ],
      food: [
        { name: 'Groceries', amount: 600 },
        { name: 'Dining out', amount: 250 },
      ],
      transport: [
        { name: 'Metro / Uber', amount: 90 },
      ],
      education: [
        { name: 'Bilingual school (2 kids)', amount: 1400 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 300 },
        { name: 'Doctor visits', amount: 50 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 50 },
        { name: 'Entertainment', amount: 150 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Budapest',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 2600 },
      ],
      utilities: [
        { name: 'Electricity & gas', amount: 140 },
        { name: 'Water', amount: 35 },
        { name: 'Internet', amount: 40 },
        { name: 'Phone (2 plans)', amount: 35 },
      ],
      food: [
        { name: 'Groceries', amount: 700 },
        { name: 'Dining out', amount: 250 },
      ],
      transport: [
        { name: 'Metro / bus passes', amount: 80 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 1800 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 300 },
        { name: 'Doctor visits', amount: 50 },
      ],
      lifestyle: [
        { name: 'Gym / thermal baths', amount: 60 },
        { name: 'Entertainment', amount: 130 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Ho Chi Minh City',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 1700 },
      ],
      utilities: [
        { name: 'Electricity', amount: 70 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 30 },
        { name: 'Phone (2 plans)', amount: 20 },
      ],
      food: [
        { name: 'Groceries', amount: 500 },
        { name: 'Dining out', amount: 220 },
      ],
      transport: [
        { name: 'Motorbike / Grab', amount: 90 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 1400 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 180 },
        { name: 'Clinic visits', amount: 50 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 35 },
        { name: 'Entertainment', amount: 100 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
  {
    name: 'Tbilisi',
    costs: {
      housing: [
        { name: 'Rent (3-bed apartment)', amount: 1400 },
      ],
      utilities: [
        { name: 'Electricity & gas', amount: 60 },
        { name: 'Water', amount: 15 },
        { name: 'Internet', amount: 25 },
        { name: 'Phone (2 plans)', amount: 15 },
      ],
      food: [
        { name: 'Groceries', amount: 500 },
        { name: 'Dining out', amount: 180 },
      ],
      transport: [
        { name: 'Metro / taxi', amount: 50 },
      ],
      education: [
        { name: 'International school (2 kids)', amount: 1000 },
      ],
      healthcare: [
        { name: 'Private insurance (family)', amount: 150 },
        { name: 'Doctor visits', amount: 30 },
      ],
      lifestyle: [
        { name: 'Gym', amount: 30 },
        { name: 'Entertainment', amount: 80 },
        { name: 'Subscriptions', amount: 50 },
      ],
      other: [],
    },
  },
]
