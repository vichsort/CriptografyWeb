import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockWidth(width: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 44,
    top: 0,
    left: 0,
    right: width,
    bottom: 44,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

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

  it('loading keeps width: min-width is locked to the width measured at rest', () => {
    mockWidth(148);
    const { rerender } = render(<Button>Encrypt</Button>);
    expect(screen.getByRole('button').style.minWidth).toBe('');
    rerender(
      <Button loading loadingLabel="Encrypting…">
        Encrypt
      </Button>,
    );
    expect(screen.getByRole('button').style.minWidth).toBe('148px');
  });

  it('releases the locked width when loading ends', () => {
    mockWidth(148);
    const { rerender } = render(<Button>Encrypt</Button>);
    rerender(<Button loading>Encrypt</Button>);
    rerender(<Button>Encrypt</Button>);
    expect(screen.getByRole('button').style.minWidth).toBe('');
  });

  it('loading shows the gerund and the ActivityIndicator, sets aria-busy, and blocks clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Encrypting…" onClick={onClick}>
        Encrypt
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Encrypting…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });
});
