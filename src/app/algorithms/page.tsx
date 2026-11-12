import type { Metadata } from 'next';
import { ui } from '@/content';
import { AlgorithmsScreen } from '@/features/home';

export const metadata: Metadata = { title: ui.algorithmsTitle };

export default function AlgorithmsPage() {
  return <AlgorithmsScreen />;
}
