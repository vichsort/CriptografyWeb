import type { Metadata } from 'next';
import { Suspense } from 'react';
import { algorithmContent } from '@/content';
import { Workbench, WorkbenchFallback } from '@/features/workbench';

type Props = PageProps<'/algorithms/[id]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: algorithmContent[id]?.intent ?? id };
}

async function AlgorithmRoute({ params }: Pick<Props, 'params'>) {
  const { id } = await params;
  return <Workbench id={id} />;
}

export default function AlgorithmPage({ params }: Props) {
  // The id is known only per request; the column's placeholder ships in the static shell.
  return (
    <Suspense fallback={<WorkbenchFallback />}>
      <AlgorithmRoute params={params} />
    </Suspense>
  );
}
