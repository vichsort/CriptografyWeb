import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Encrypt</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Encrypt' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Copy</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('loading keeps width: a button that can load reserves its loading layout at rest', () => {
    // Layout is not measurable in jsdom; this checks the structure that keeps the width (one grid
    // cell holding both layouts). Chrome measurements are in the ledger.
    const { rerender } = render(
      <Button loading={false} loadingLabel="Encrypting…">
        Encrypt
      </Button>,
    );
    const reserve = screen.getByRole('button').querySelector('[data-reserve]');
    expect(reserve).toHaveAttribute('aria-hidden', 'true');
    expect(reserve).toHaveClass('invisible');
    expect(reserve).toHaveTextContent('Encrypting…');
    expect(reserve?.querySelector('[data-indicator-slot]')).not.toBeNull();
    rerender(
      <Button loading loadingLabel="Encrypting…">
        Encrypt
      </Button>,
    );
    expect(screen.getByRole('button').querySelector('[data-reserve]')).not.toBeNull();
  });

  it('reserves nothing on a button that never loads', () => {
    render(<Button>Copy</Button>);
    expect(screen.getByRole('button').querySelector('[data-reserve]')).toBeNull();
  });

  it('loading shows the gerund and the ActivityIndicator, sets aria-busy, and blocks clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Encrypting…" onClick={onClick}>
        Encrypt
      </Button>,
    );
    // The indicator is decorative inside the button: its name is the gerund alone.
    const button = screen.getByRole('button', { name: 'Encrypting…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelectorAll('[data-indicator-slot] [data-spoke]')).toHaveLength(0);
    expect(
      button.querySelectorAll(':scope > span > :not([data-reserve]) [data-spoke]'),
    ).toHaveLength(8);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading does not submit its form', async () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Run
        </Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stays focusable while loading', () => {
    render(<Button loading>Run</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
  });

  it('has no indicator and no aria-busy at rest', () => {
    render(<Button>Encrypt</Button>);
    expect(screen.getByRole('button').querySelector('[data-spoke]')).toBeNull();
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });
});
