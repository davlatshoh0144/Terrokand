import type { DiscoveryCard } from './types';

// ==========================================
// Magic Carpet Ride - Educational Discovery Cards
// Rich content about Uzbekistan's mathematicians, astronomers,
// scientists, culture, places, and inventions
// ==========================================

export const DISCOVERY_CARDS: DiscoveryCard[] = [
  // --- MATHEMATICIANS & SCIENTISTS ---
  {
    id: 'al-khwarizmi',
    title: 'Al-Khwarizmi — Father of Algebra',
    content: 'Muhammad ibn Musa al-Khwarizmi (780-850) was born in Khiva, Uzbekistan, and is known as the "Father of Algebra!" His book "Al-Kitab al-Mukhtasar fi Hisab al-Jabr wal-Muqabala" gave us the word "algebra" (from "al-jabr"). But that\'s not all — his name "al-Khwarizmi" is the origin of the word "algorithm!" He introduced the Hindu-Arabic numeral system (0, 1, 2, 3...) to the world, which replaced Roman numerals. Without him, modern mathematics, computers, and smartphones wouldn\'t exist!',
    image: './images/bg-khiva.jpg',
    levelId: 2,
    bonusPoints: 80,
  },
  {
    id: 'silk-road',
    title: 'The Great Silk Road',
    content: 'The Silk Road was not a single road, but a vast network of trade routes connecting East Asia to the Mediterranean! For over 1,500 years, merchants traveled through Uzbekistan carrying silk, spices, gold, and ideas. Cities like Samarkand and Bukhara became fabulously wealthy as trading hubs. The Silk Road also exchanged knowledge: paper-making from China, astronomy from Persia, mathematics from India — all met here in the heart of Central Asia! The word "Silk Road" was coined by a German explorer in 1877, but the routes existed since the Han Dynasty (around 130 BC).',
    image: './images/bg-samarkand.jpg',
    levelId: 3,
    bonusPoints: 80,
  },
  {
    id: 'ibn-sina',
    title: 'Ibn Sina (Avicenna) — The Universal Genius',
    content: 'Ibn Sina, known in the West as Avicenna (980-1037), was born near Bukhara and became one of the most influential scientists in history! By age 18, he had mastered medicine, mathematics, physics, and philosophy. His book "The Canon of Medicine" was used as the standard medical textbook in Europe and the Islamic world for over 600 years! He was the first to describe diabetes, cataracts, and how diseases spread through water and soil. He also made groundbreaking contributions to geology, psychology, and music theory.',
    image: './images/bg-samarkand.jpg',
    levelId: 4,
    bonusPoints: 100,
  },
  {
    id: 'timur',
    title: 'Amir Timur (Tamerlane) — The Conqueror Builder',
    content: 'Amir Timur (1336-1405), known in the West as Tamerlane, was born near Samarkand and built one of the largest empires in history! Despite being a conqueror, he was a great patron of arts and architecture. He brought the finest architects, artisans, and scholars to his capital, Samarkand, transforming it into the most beautiful city in the world. After battles, he would plant gardens and build schools. His descendants continued this legacy — his great-great-grandson Ulugh Beg built an incredible observatory!',
    image: './images/bg-samarkand.jpg',
    levelId: 5,
    bonusPoints: 100,
  },
  {
    id: 'registan',
    title: 'Registan Square — Heart of Samarkand',
    content: 'The Registan was the heart of ancient Samarkand — a magnificent public square surrounded by three grand madrasahs (Islamic schools): Ulugh Beg, Sher-Dor, and Tillya-Kori. "Registan" means "sandy place" in Persian. The stunning turquoise domes and intricate tilework you see are examples of Islamic art at its peak. The square was a center of learning where scholars studied mathematics, astronomy, theology, and philosophy. The Sher-Dor madrasah has tiger mosa chasing a sun on its facade — a bold artistic choice since Islam traditionally avoids depicting living creatures!',
    image: './images/bg-samarkand.jpg',
    levelId: 6,
    bonusPoints: 120,
  },
  // --- ASTRONOMY & SCIENCE ---
  {
    id: 'astronomy',
    title: 'Ulugh Beg Observatory — Stars of Central Asia',
    content: 'Ulugh Beg (1394-1449), grandson of Amir Timur, was more interested in stars than warfare! He built a magnificent observatory in Samarkand and compiled the "Zij-i-Sultani" star catalog, which catalogued 1,018 stars and calculated the length of the sidereal year with remarkable accuracy — his measurement was off by only 1 minute! His observatory featured a massive meridian arc (part of which still stands today), allowing him to measure celestial positions with incredible precision. He was centuries ahead of European astronomers!',
    image: './images/bg-mountains.jpg',
    levelId: 7,
    bonusPoints: 120,
  },
  {
    id: 'al-biruni',
    title: 'Al-Biruni — The First Anthropologist',
    content: 'Abu Rayhan al-Biruni (973-1048) was born near the Aral Sea and became one of history\'s greatest polymaths! He calculated the radius of the Earth with incredible accuracy using a simple mountain and trigonometry. He wrote 146 books covering mathematics, astronomy, physics, geology, and history. He was the first person to describe the concept of gravity, suggesting that the Earth attracts objects toward its center — centuries before Newton! He also studied Indian culture scientifically, making him the world\'s first anthropologist.',
    image: './images/bg-desert.jpg',
    levelId: 8,
    bonusPoints: 150,
  },
  // --- CITIES & PLACES ---
  {
    id: 'bukhara',
    title: 'Bukhara — City of a Thousand Domes',
    content: 'Bukhara, one of Central Asia\'s oldest cities, has stood for over 2,500 years! Known as the "City of a Thousand Domes" for its stunning skyline of blue-tiled domes, Bukhara was a major center of Islamic learning. The Kalyan Minaret (46 meters tall, built in 1127) is so magnificent that Genghis Khan spared it when he destroyed the rest of the city! Bukhara\'s old city center is a UNESCO World Heritage Site with over 140 protected monuments. It was here that Ibn Sina studied medicine as a teenager.',
    image: './images/bg-samarkand.jpg',
    levelId: 9,
    bonusPoints: 150,
  },
  {
    id: 'khiva-history',
    title: 'Itchan Kala — The Inner Fortress',
    content: 'Khiva\'s Itchan Kala is one of the best-preserved medieval cities in Central Asia and a UNESCO World Heritage Site! This walled inner city contains over 50 historic monuments, including palaces, mosques, madrasahs, and minarets — all within less than one square kilometer. The city has been inhabited for over 2,500 years and was a crucial stop on the Silk Road. Walking through its narrow streets is like traveling back in time! The Kalta Minor minaret, with its stunning blue tiles, was meant to be the tallest in the world but was left unfinished.',
    image: './images/bg-khiva.jpg',
    levelId: 10,
    bonusPoints: 200,
  },
  // --- CULTURE & TRADITIONS ---
  {
    id: 'uzbek-culture',
    title: 'Uzbek Crafts — Blue Gold of Rishtan',
    content: 'Uzbekistan has incredibly rich craft traditions! The famous blue ceramics from Rishtan are made using techniques passed down for over 800 years. The blue color comes from natural cobalt oxide, giving the pottery its stunning "blue gold" appearance. Suzani embroidery — intricate silk-thread patterns on cotton — takes months to complete and decorates homes and traditional clothing. The Uzbek doppa (skullcap) that our character wears is a national symbol, with different regions having their own unique geometric patterns. Carpet-weaving remains one of Uzbekistan\'s most treasured arts!',
    image: './images/bg-khiva.jpg',
    levelId: 3,
    bonusPoints: 80,
  },
  {
    id: 'navoi',
    title: 'Alisher Navoi — The Shakespeare of the East',
    content: 'Alisher Navoi (1441-1501) is Uzbekistan\'s greatest poet and is called the "Shakespeare of the East!" He wrote in both Persian and Turkic, and his works include epic poems, lyrics, and philosophical writings. Navoi was also a statesman, artist, and philanthropist who built hospitals, schools, and orphanages. He wrote in Chagatai Turkic to prove that the Turkic language was just as capable of expressing deep philosophical and artistic ideas as Arabic or Persian. His works are still beloved across Central Asia today!',
    image: './images/bg-mountains.jpg',
    levelId: 4,
    bonusPoints: 100,
  },
  {
    id: 'uzbekistan-today',
    title: 'Uzbekistan Today — A Modern Silk Road',
    content: 'Modern Uzbekistan, independent since 1991, is Central Asia\'s most populous country with over 35 million people! Tashkent, its capital, is the largest city in the region and was completely rebuilt after a devastating earthquake in 1966. Uzbekistan is the world\'s 7th largest producer of gold and 11th largest producer of natural gas. The country is home to 4 UNESCO World Heritage Sites and 7 UNESCO Intangible Cultural Heritage traditions. Since 2016, Uzbekistan has opened up to tourism, welcoming visitors to see magnificent Silk Road cities, experience traditional hospitality, and taste famous dishes like plov — the national dish of Uzbekistan!',
    image: './images/bg-desert.jpg',
    levelId: 5,
    bonusPoints: 100,
  },
  // --- INVENTIONS & DISCOVERIES ---
  {
    id: 'arabic-numerals',
    title: 'How 0, 1, 2, 3... Changed the World',
    content: 'Did you know that the numbers we use every day (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) came to the world through Uzbekistan? These are called "Arabic numerals" but they were actually developed in India and transmitted to the world by Central Asian mathematicians like al-Khwarizmi! Before these numbers, people used Roman numerals (I, II, III, IV, V...) which made calculations incredibly difficult. The concept of ZERO as a number (not just "nothing") was one of humanity\'s greatest inventions — and it came through the Silk Road, passing through Uzbekistan!',
    image: './images/bg-samarkand.jpg',
    levelId: 6,
    bonusPoints: 120,
  },
  {
    id: 'uzbek-music',
    title: 'Shashmaqam — The Six Modes of Music',
    content: 'Shashmaqam is a classical music tradition from Bukhara that is recognized as a UNESCO Intangible Cultural Heritage! The name means "Six Modes" and it combines instrumental music, singing, and poetry into a complex, structured form. Each performance can last several hours and follows a specific order of musical modes. The tradition has been passed down orally for centuries from master to apprentice. Traditional Uzbek instruments include the dutar (a two-stringed lute), the tanbur (long-necked lute), and the doira (a frame drum made from animal skin and wood).',
    image: './images/bg-khiva.jpg',
    levelId: 7,
    bonusPoints: 120,
  },
  {
    id: 'uzbek-food',
    title: 'Plov — The King of Uzbek Cuisine',
    content: 'Plov is Uzbekistan\'s national dish and is so important that it has its own UNESCO Intangible Cultural Heritage status! This rich rice dish is cooked in a large cast-iron pot called a "kazan" and typically contains rice, lamb, carrots, onions, and chickpeas, seasoned with cumin and barberries. Each region has its own variation — Samarkand plov is mild, while Fergana plov is spicier! Preparing plov is traditionally a man\'s job in Uzbekistan, and there are even competitions where chefs cook massive quantities to feed hundreds of people at weddings and celebrations.',
    image: './images/bg-desert.jpg',
    levelId: 8,
    bonusPoints: 150,
  },
  {
    id: 'aral-sea',
    title: 'The Aral Sea — A Lost Wonder',
    content: 'The Aral Sea, once the world\'s fourth-largest lake, was a paradise of fish and wildlife on the border of Uzbekistan and Kazakhstan. But in the 1960s, Soviet irrigation projects diverted the two rivers that fed it, causing the sea to shrink to less than 10% of its original size! This became one of the world\'s worst environmental disasters. Ships now sit abandoned in the desert where the sea used to be. Today, Kazakhstan has made progress restoring the Northern Aral Sea, and the region is slowly coming back to life. The story teaches us how important it is to protect our environment!',
    image: './images/bg-mountains.jpg',
    levelId: 9,
    bonusPoints: 150,
  },
  {
    id: 'fergana-valley',
    title: 'Fergana Valley — The Breadbasket of Central Asia',
    content: 'The Fergana Valley in eastern Uzbekistan is one of the most fertile regions in all of Central Asia! Surrounded by the Tian Shan and Pamir mountains, this valley has been cultivated for thousands of years. It produces cotton, fruits (especially apricots, melons, and grapes), vegetables, and wheat. The valley is also famous for its silk production — continuing the ancient Silk Road tradition! The city of Margilan in the Fergana Valley has produced silk using traditional methods for over 2,000 years, with patterns inspired by nature and Islamic geometric designs.',
    image: './images/bg-mountains.jpg',
    levelId: 10,
    bonusPoints: 200,
  },
];

export function getDiscoveryForLevel(levelId: number): DiscoveryCard | null {
  // Return a random undiscovered card for this level
  const levelCards = DISCOVERY_CARDS.filter((d) => d.levelId === levelId);
  if (levelCards.length === 0) return null;
  return levelCards[Math.floor(Math.random() * levelCards.length)];
}

export function getDiscoveryById(id: string): DiscoveryCard | null {
  return DISCOVERY_CARDS.find((d) => d.id === id) || null;
}

export function getAllDiscoveriesForLevel(levelId: number): DiscoveryCard[] {
  return DISCOVERY_CARDS.filter((d) => d.levelId === levelId);
}
