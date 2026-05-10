import type { LevelConfig, StarThreshold } from './types';

export const STAR_THRESHOLDS: StarThreshold = {
  one: 1000,
  two: 2500,
  three: 4000,
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Samarkand',
    nameUz: 'Samarqand',
    location: 'City of Blue Domes',
    description: 'Rebuild Registan Square by gathering resources and restoring each stage.',
    backgroundImage: './assets/bg-samarkand.jpg',
    groundColor: '#c9a855',
    skyColor: '#1a0a4a',
    obstacleTypes: ['bird', 'cloud'],
    obstacleFrequency: 2500,
    collectibleFrequency: 1200,
    powerUpFrequency: 10000,
    scrollSpeed: 2.5,
    distance: 3000,
    facts: [
      'The Registan Square has three massive madrasahs built in the 15th-17th centuries!',
      'Samarkand\'s blue tiles are made with lapis lazuli pigment!',
      'The Ulugh Beg Madrasah was one of the best universities in the Muslim world!',
      'Amir Timur made Samarkand the capital of his empire in the 14th century!',
    ],
    unlocked: true,
    stars: 0,
    highScore: 0,
    miniGame: 'runner',
    missionType: 'collect',
    missionTarget: 1,
    missionItems: [
      { emoji: '??', name: 'Restoration Stage' },
    ],
    missionDescription: 'Complete Registan Restoration',
    duration: 0,
  },
  {
    id: 2,
    name: 'Bukhara',
    nameUz: 'Buxoro',
    location: 'Ancient Merchant City',
    description: 'Fly through ancient alleys and collect the lost blue tiles!',
    backgroundImage: './assets/bg-bukhara.jpg',
    groundColor: '#d4a855',
    skyColor: '#2a1810',
    obstacleTypes: ['bird', 'balloon', 'cloud'],
    obstacleFrequency: 2000,
    collectibleFrequency: 1000,
    powerUpFrequency: 9000,
    scrollSpeed: 3.5,
    distance: 4000,
    facts: [
      'Bukhara has over 140 architectural monuments!',
      'The city was a major center of Islamic learning for centuries.',
      'Bukhara\'s old city center is a UNESCO World Heritage Site.',
      'The Ark of Bukhara is a massive fortress over 1,500 years old!',
    ],
    unlocked: false,
    stars: 0,
    highScore: 0,
    miniGame: 'runner',
    missionType: 'collect',
    missionTarget: 10,
    missionItems: [
      { emoji: '??', name: 'Blue Tile' },
    ],
    missionDescription: 'Collect 10 Blue Tiles',
    duration: 0,
  },
  {
    id: 3,
    name: 'Khiva',
    nameUz: 'Xiva',
    location: 'Oasis on the Golden Road',
    description: 'Survive the raging sandstorm and escape to safety!',
    backgroundImage: './assets/bg-khiva.jpg',
    groundColor: '#8b7355',
    skyColor: '#0a0a2e',
    obstacleTypes: ['bird', 'arch', 'cloud', 'balloon'],
    obstacleFrequency: 1400,
    collectibleFrequency: 800,
    powerUpFrequency: 7000,
    scrollSpeed: 4,
    distance: 7000,
    facts: [
      'Khiva\'s Itchan Kala is a walled inner town with over 50 historic monuments!',
      'The city was an important stop on the Golden Road for centuries.',
      'Khiva is known as a museum city under the open sky.',
      'The minaret of Islam Khodja is the tallest in Khiva at 45 meters!',
    ],
    unlocked: false,
    stars: 0,
    highScore: 0,
    miniGame: 'runner',
    missionType: 'survive',
    missionTarget: 0,
    missionItems: [],
    missionDescription: 'Survive the Sandstorm',
    duration: 90,
  },
];

export function getStarCount(score: number): number {
  if (score >= STAR_THRESHOLDS.three) return 3;
  if (score >= STAR_THRESHOLDS.two) return 2;
  if (score >= STAR_THRESHOLDS.one) return 1;
  return 0;
}

export function getDifficultyMultiplier(difficulty: 'easy' | 'normal' | 'hard'): number {
  switch (difficulty) {
    case 'easy': return 0.7;
    case 'normal': return 1;
    case 'hard': return 1.4;
  }
}
