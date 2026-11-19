export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export const CARD_COLORS = {
  red: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-red-500', shadow: 'shadow-red-500/50' },
  green: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-500', shadow: 'shadow-green-500/50' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-500', shadow: 'shadow-blue-500/50' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50' },
  wild: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-purple-400', shadow: 'shadow-purple-500/50' },
};
