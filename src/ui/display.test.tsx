import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlassCard } from './GlassCard';
import { BrandMark } from './BrandMark';
import { IconTile } from './IconTile';
import { Skeleton } from './Skeleton';

describe('GlassCard', () => {
  it('puts title, hint and description inside the card, content below', () => {
    render(
      <GlassCard title="Input" hint="spaces count" description="Type or paste.">
        <textarea aria-label="Input" />
      </GlassCard>,
    );
    const heading = screen.getByRole('heading', { name: 'Input' });
    const field = screen.getByRole('textbox');
    expect(screen.getByText('spaces count')).toBeInTheDocument();
    expect(screen.getByText('Type or paste.')).toBeInTheDocument();
    expect(heading.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is a region named by its title', () => {
    render(<GlassCard title="Encrypt">x</GlassCard>);
    expect(screen.getByRole('region', { name: 'Encrypt' })).toBeInTheDocument();
  });

  it('uses the thin material when asked', () => {
    const { container } = render(<GlassCard material="thin">x</GlassCard>);
    expect(container.firstElementChild).toHaveClass('material-glass-thin');
  });

  it('flush content runs edge to edge, clipped to the corners', () => {
    const { container } = render(
      <GlassCard title="Encrypt" flush>
        <ul data-testid="rows" />
      </GlassCard>,
    );
    expect(container.firstElementChild).toHaveClass('overflow-hidden');
    const body = screen.getByTestId('rows').parentElement;
    expect(body).not.toHaveClass('px-4');
  });
});

describe('IconTile', () => {
  it('is decorative and uses the color token', () => {
    const { container } = render(<IconTile glyph="Cs" color="encryption-2" />);
    const tile = container.firstElementChild;
    expect(tile).toHaveAttribute('aria-hidden', 'true');
    expect(tile).toHaveClass('bg-icon-encryption-2');
    expect(tile).toHaveTextContent('Cs');
  });
});

describe('Skeleton', () => {
  it('renders the requested number of placeholder rows and announces loading', () => {
    const { container } = render(<Skeleton rows={4} />);
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[data-skeleton-row]')).toHaveLength(4);
  });
});

describe('BrandMark', () => {
  it('is a decorative tile in the inverse label colors', () => {
    const { container } = render(<BrandMark glyph="C" />);
    const mark = container.firstElementChild;
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveClass('bg-label', 'text-label-inverse');
    expect(mark).toHaveTextContent('C');
  });
});
