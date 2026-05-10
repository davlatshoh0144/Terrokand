import type { RewardItem } from './types';

export const ALL_REWARDS: RewardItem[] = [
  { id: 'samarkand-sticker', name: 'Registan Sticker', emoji: '🏛️', city: 'Samarkand', type: 'sticker', description: 'The magnificent blue domes of Registan Square!' },
  { id: 'bukhara-sticker', name: 'Bukhara Sticker', emoji: '🕌', city: 'Bukhara', type: 'sticker', description: 'The ancient Ark fortress of Bukhara!' },
  { id: 'khiva-sticker', name: 'Khiva Sticker', emoji: '🌙', city: 'Khiva', type: 'sticker', description: 'The walled city of Itchan Kala under moonlight!' },
  { id: 'doppi', name: 'Traditional Doppi', emoji: '🎩', city: 'Samarkand', type: 'hat', description: 'A beautiful embroidered skullcap!' },
  { id: 'tubeteika', name: 'Tubeteika', emoji: '👳', city: 'Bukhara', type: 'hat', description: 'A colorful traditional Uzbek hat!' },
  { id: 'dutar', name: 'Dutar', emoji: '🪕', city: 'Samarkand', type: 'instrument', description: 'A two-stringed lute with a haunting melody!' },
  { id: 'doira', name: 'Doira', emoji: '🥁', city: 'Bukhara', type: 'instrument', description: 'A traditional frame drum for celebrations!' },
  { id: 'plov-card', name: 'Plov Recipe', emoji: '🍲', city: 'Bukhara', type: 'food', description: 'The secret recipe for the perfect Uzbek plov!' },
  { id: 'samsa-card', name: 'Samsa Recipe', emoji: '🥯', city: 'Khiva', type: 'food', description: 'Crispy, juicy baked Samarkand samsa!' },
  { id: 'sapphire', name: 'Samarkand Sapphire', emoji: '💎', city: 'Samarkand', type: 'gem', description: 'A brilliant blue gem from the heart of Terrokand!' },
  { id: 'moon-orb', name: 'Desert Moon Orb', emoji: '🔮', city: 'Khiva', type: 'gem', description: 'A mystical orb glowing with desert starlight!' },
  { id: 'crown-gem', name: "Timur's Crown Gem", emoji: '👑', city: 'Samarkand', type: 'gem', description: 'A golden gem once worn by Amir Timur himself!' },
];

export function getRandomRewards(city: string, stars: number): RewardItem[] {
  const cityRewards = ALL_REWARDS.filter((r) => r.city === city);
  const bonusRewards = ALL_REWARDS.filter((r) => r.city !== city);

  const result: RewardItem[] = [];

  // Base rewards from the city
  const shuffledCity = [...cityRewards].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(stars, shuffledCity.length); i++) {
    result.push(shuffledCity[i]);
  }

  // Bonus reward for 3 stars
  if (stars === 3 && bonusRewards.length > 0) {
    const shuffledBonus = [...bonusRewards].sort(() => Math.random() - 0.5);
    result.push(shuffledBonus[0]);
  }

  return result;
}

export function getCollectedRewards(): RewardItem[] {
  const saved = localStorage.getItem('silkroad_rewards');
  if (!saved) return [];
  const ids: string[] = JSON.parse(saved);
  return ALL_REWARDS.filter((r) => ids.includes(r.id));
}

export function addRewards(newRewards: RewardItem[]) {
  const existing = getCollectedRewards();
  const existingIds = new Set(existing.map((r) => r.id));
  const added: RewardItem[] = [];

  for (const reward of newRewards) {
    if (!existingIds.has(reward.id)) {
      existingIds.add(reward.id);
      added.push(reward);
    }
  }

  localStorage.setItem('silkroad_rewards', JSON.stringify([...existingIds]));
  return added;
}

export function clearRewards() {
  localStorage.removeItem('silkroad_rewards');
}
