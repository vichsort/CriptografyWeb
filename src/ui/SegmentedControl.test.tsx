import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'encrypt', label: 'Encrypt' },
  { value: 'decrypt', label: 'Decrypt' },
] as const;

function Mode() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  return <SegmentedControl options={options} value={mode} onChange={setMode} ariaLabel="Mode" />;
}

describe('SegmentedControl', () => {
  it('is a radiogroup with one checked radio, the only one in the tab order', () => {
    render(<Mode />);
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    const [encrypt, decrypt] = screen.getAllByRole('radio');
    expect(encrypt).toHaveAttribute('aria-checked', 'true');
    expect(encrypt).toHaveAttribute('tabindex', '0');
    expect(decrypt).toHaveAttribute('aria-checked', 'false');
    expect(decrypt).toHaveAttribute('tabindex', '-1');
  });

  it('is operable with arrow keys, wrapping around, and moves focus along', async () => {
    render(<Mode />);
    const encrypt = screen.getByRole('radio', { name: 'Encrypt' });
    const decrypt = screen.getByRole('radio', { name: 'Decrypt' });
    encrypt.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(decrypt).toHaveAttribute('aria-checked', 'true');
    expect(decrypt).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(encrypt).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    expect(decrypt).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{ArrowUp}');
    expect(encrypt).toHaveAttribute('aria-checked', 'true');
  });

  it('selects on click', async () => {
    render(<Mode />);
    await userEvent.click(screen.getByRole('radio', { name: 'Decrypt' }));
    expect(screen.getByRole('radio', { name: 'Decrypt' })).toHaveAttribute('aria-checked', 'true');
  });

  it('stays reachable by Tab when the value matches no option', () => {
    render(
      <SegmentedControl
        options={options}
        value={'hash' as 'encrypt'}
        onChange={() => {}}
        ariaLabel="Mode"
      />,
    );
    const [first, second] = screen.getAllByRole('radio');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
  });
});
