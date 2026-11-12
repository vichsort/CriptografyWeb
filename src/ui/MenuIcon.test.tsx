import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuIcon } from './MenuIcon';

const paths = (container: HTMLElement) =>
  [...container.querySelectorAll('path')].map((p) => p.getAttribute('d'));

describe('MenuIcon', () => {
  it('draws two bars when closed and a cross when open, hidden from assistive tech', () => {
    const closed = render(<MenuIcon open={false} />);
    expect(closed.container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(paths(closed.container)).toEqual(['M4 8L20 8', 'M4 16L20 16']);

    const open = render(<MenuIcon open />);
    expect(paths(open.container)).toEqual(['M6 6L18 18', 'M6 18L18 6']);
  });
});
