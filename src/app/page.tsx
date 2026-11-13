import { Home } from '@/features/home';
import { PageTransition } from '@/ui';

export default function HomePage() {
  return (
    <PageTransition>
      <Home />
    </PageTransition>
  );
}
