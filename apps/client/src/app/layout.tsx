import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '../components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'UNO Online — Premium Multiplayer Card Game',
  description: 'Play UNO online with friends! Real-time multiplayer card game with premium experience.',
  keywords: ['uno', 'card game', 'multiplayer', 'online game'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
