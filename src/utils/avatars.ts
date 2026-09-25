export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'cowboy', name: 'Gunslinger', emoji: '🤠' },
  { id: 'sheriff', name: 'Sheriff', emoji: '⭐' },
  { id: 'bandit', name: 'Bandit', emoji: '🥷' },
  { id: 'lightning', name: 'Flash', emoji: '⚡' },
  { id: 'target', name: 'Deadeye', emoji: '🎯' },
  { id: 'bull', name: 'Bison', emoji: '🐂' },
  { id: 'eagle', name: 'Hawk', emoji: '🦅' },
  { id: 'cactus', name: 'Outlaw', emoji: '🌵' },
  { id: 'skull', name: 'Phantom', emoji: '💀' },
  { id: 'dynamite', name: 'Blaster', emoji: '🧨' },
  { id: 'flame', name: 'Blaze', emoji: '🔥' },
  { id: 'cyber', name: 'Cyborg', emoji: '🤖' },
];

export const PLAYER_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

export const BOT_NAMES = [
  { name: 'Sheriff Wyatt', avatar: '⭐', color: '#f59e0b' },
  { name: 'Billy the Kid', avatar: '🤠', color: '#ef4444' },
  { name: 'Doc Holiday', avatar: '💀', color: '#8b5cf6' },
  { name: 'Annie Oakley', avatar: '🎯', color: '#ec4899' },
  { name: 'Jesse James', avatar: '🥷', color: '#3b82f6' },
  { name: 'Calamity Jane', avatar: '🔥', color: '#f97316' },
];
