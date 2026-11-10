import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListRow } from './ListRow';

const inList = (node: React.ReactNode) => render(<ul>{node}</ul>);

describe('ListRow', () => {
  it('with href renders a link', () => {
    inList(<ListRow title="Caesar" subtitle="Shift letters" href="/encryption/caesar" />);
    const link = screen.getByRole('link', { name: /Caesar/ });
    expect(link).toHaveAttribute('href', '/encryption/caesar');
    expect(screen.getByText('Shift letters')).toBeInTheDocument();
  });

  it('with onSelect renders a button that calls it', async () => {
    const onSelect = vi.fn();
    inList(<ListRow title="Caesar" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /Caesar/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('selected sets aria-current', () => {
    inList(
      <>
        <ListRow title="Caesar" href="/a" selected />
        <ListRow title="Hill" href="/b" />
        <ListRow title="Base64" onSelect={() => {}} selected />
      </>,
    );
    expect(screen.getByRole('link', { name: /Caesar/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Hill/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: /Base64/ })).toHaveAttribute('aria-current', 'true');
  });

  it('is a list item, and static without href or onSelect', () => {
    inList(<ListRow title="Caesar" />);
    expect(screen.getByRole('listitem')).toHaveTextContent('Caesar');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('draws a decorative chevron only when asked', () => {
    const { container, rerender } = render(
      <ul>
        <ListRow title="Caesar" href="/a" chevron />
      </ul>,
    );
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    rerender(
      <ul>
        <ListRow title="Caesar" href="/a" />
      </ul>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
