import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('is labelled and turns off autocapitalize, autocorrect and spellcheck', () => {
    render(<TextField label="Key" />);
    const input = screen.getByLabelText('Key');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('secret toggles visibility and keeps autocomplete off', async () => {
    render(<TextField label="Key" secret defaultValue="hunter2" />);
    const input = screen.getByLabelText('Key');
    const reveal = screen.getByRole('button', { name: 'Show' });
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(reveal).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(reveal);
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(reveal).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(reveal);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('describes itself with help and error, and marks the error invalid', () => {
    const { rerender } = render(<TextField label="Key" help="64 hex characters" />);
    const input = screen.getByLabelText('Key');
    expect(input).toHaveAccessibleDescription('64 hex characters');
    expect(input).not.toHaveAttribute('aria-invalid');
    rerender(<TextField label="Key" help="64 hex characters" error="Too short." />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('64 hex characters Too short.');
  });
});
