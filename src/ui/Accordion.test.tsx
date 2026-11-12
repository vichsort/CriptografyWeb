import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Accordion } from './Accordion';

function Family() {
  const [open, setOpen] = useState(false);
  return (
    <Accordion title="Encryption" count={6} open={open} onOpenChange={setOpen}>
      <p>Caesar</p>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('button has aria-expanded and toggles', async () => {
    render(<Family />);
    const button = screen.getByRole('button', { name: /Encryption/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    expect(screen.queryByText('Caesar')).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Caesar')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-controls', screen.getByText('Caesar').closest('[id]')?.id);
  });

  it('shows the count and reports the requested state', async () => {
    const onOpenChange = vi.fn();
    render(
      <Accordion title="Hashing" count={3} open onOpenChange={onOpenChange}>
        x
      </Accordion>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Hashing/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses the regular glass material', () => {
    const { container } = render(<Family />);
    expect(container.firstElementChild).toHaveClass('material-glass-regular');
  });
});
