export const CONTENT_VERSION = '0.4.0';
export const MISSION_IDS = ['delivery','anomaly','stickers','home','mintDate'] as const;
export type MissionId = typeof MISSION_IDS[number];
export const MINT_HOME_SPOT = {x:-1.05,z:-1.6};
export const MINT_COURTYARD = {x:-2,z:4};
export const CAFE = {
  door:{x:-2.5,z:-3.65}, outside:{x:-2.5,z:-2.1}, entry:{x:4.8,z:3.2},
  exit:{x:4.8,z:4.1}, counter:{x:1.8,z:-1.35}, table:{x:-2.6,z:-.4},
  mint:{x:-2.75,z:-1.8},
} as const;
export const CAFE_DRINKS = {
  tea:{name:'Jasmine tea',price:18,color:'#d5bc76',note:'Floral, warm, and a little like a garden after rain.',sip:'The jasmine smells like a little garden. You let the warmth linger.'},
  soda:{name:'Strawberry soda',price:24,color:'#db8f98',note:'Pink fizz, a berry garnish, and a very unhurried afternoon.',sip:'Tiny strawberry bubbles dance on your tongue. The afternoon feels brighter.'},
  latte:{name:'Honey cloud latte',price:28,color:'#c99d70',note:'Mellow coffee under a soft cap of honey milk foam.',sip:'A little honey, a little coffee. You take a breath and watch the world slow down.'},
  matcha:{name:'Vanilla matcha',price:30,color:'#94ad79',note:'Soft green tea with milk and a whisper of vanilla.',sip:'Earthy matcha and sweet vanilla. For a moment, there is nowhere else to be.'},
} as const;
export type CafeDrinkId = keyof typeof CAFE_DRINKS;
export const MINT_DATE_STOPS = {
  cafe: { x: -2.5, z: 1, name: 'Morrow Café', hint: 'Enter Morrow Café, order at the counter, and share a drink with Mint by the window.' },
  apartment: { x:-11, z:-2.4, name:'Lane House', hint:'Bring Mint to your apartment, then talk to her by the bed.' },
  canal: { x: 12, z: 8.5, name: 'Canal walk', hint: 'Meet Mint at the canal overlook for a quiet moment together.' },
} as const;
export const CHARACTERS = {
  mint: { name: 'Mint', color: '#65c9b5', hair: '#4aaeb0', role: 'Your neighborhood guide', model: 'assets/characters/mint.glb' },
  nanally: { name: 'Nanally', color: '#e68b8e', hair: '#e79193', role: 'Head of very important adventures', model: 'assets/characters/nanally.glb' },
  hotori: { name: 'Hotori', color: '#a59dc7', hair: '#493849', role: 'Keeper of curious things', model: 'assets/characters/hotori.glb' },
} as const;
export type CharacterId = keyof typeof CHARACTERS;
export const CATALOG = {
  lamp: { name: 'Honeyglow lamp', price: 180, size: [0.6, 0.6], color: '#edbb60', desc: 'A small pool of evening light.', category: 'LIGHTING' },
  plant: { name: 'Sunday monstera', price: 120, size: [0.8, 0.8], color: '#6a9570', desc: 'A little green company for your room.', category: 'GREENERY' },
  cushion: { name: 'Cloud cushion', price: 90, size: [0.8, 0.8], color: '#e9977e', desc: 'For doing absolutely nothing.', category: 'COMFORT' },
  shelf: { name: 'Little archive', price: 260, size: [1.4, 0.5], color: '#b98b67', desc: 'For books, treasures, and almost-treasures.', category: 'STORAGE' },
  sofa: { name: 'Matcha loveseat', price: 450, size: [1.8, 0.9], color: '#8aa88b', desc: 'Room for you and a friend.', category: 'COMFORT' },
  table: { name: 'Roundabout table', price: 200, size: [1, 1], color: '#c09b72', desc: 'Everything looks better with tea.', category: 'LIVING' },
  rug: { name: 'Peach afternoon rug', price: 140, size: [2, 1.5], color: '#e4aa8d', desc: 'A soft place to call your own.', category: 'TEXTILES' },
  clock: { name: 'Peculiar little clock', price: 0, size: [0.6, 0.6], color: '#a6a1c7', desc: 'Always a little ahead of itself. A gift from Hotori.', category: 'KEEPSAKE' },
} as const;
export type ItemId = keyof typeof CATALOG;
export const COLLECTIBLES = [
  {id:'sticker-cafe', x:-4, z:-2, label:'Moon sticker', kind:'sticker'},
  {id:'sticker-canal', x:13, z:10, label:'Fish sticker', kind:'sticker'},
  {id:'sticker-alley', x:-15, z:1, label:'Cat sticker', kind:'sticker'},
  {id:'odd-clock', x:-14, z:-3, label:'A softly ticking parcel', kind:'anomaly'},
] as const;
export const AMBIENT: Record<CharacterId,string[]> = {
  mint: ['The nice thing about this block? You can take the long way home and still be home in a minute.', 'Someone left a tiny umbrella by the canal. I hope its owner is tiny, too.', 'You don’t have to do everything today. I’m happy you stopped by.'],
  nanally: ['A proper neighborhood needs a name for every alley. I’m accepting dramatic suggestions.', 'Our next grand expedition could be to the café. The distance is small. The stakes are pastry.', 'I’ve decided that finding the perfect bench counts as an adventure.'],
  hotori: ['Objects collect stories. Occasionally, the stories collect objects.', 'The clock in my window runs backward on Tuesdays. It has never explained why.', 'Some things are valuable because someone decided to keep them.'],
};
