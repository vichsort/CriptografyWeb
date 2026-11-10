import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

const labels = { light: 'Light', dark: 'Dark', useSystem: 'Use system setting' };

describe('ThemeToggle', () => {
  it('is a switch that is on in dark mode, and toggles', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <ThemeToggle
        resolved="light"
        explicit={false}
        onToggle={onToggle}
        onUseSystem={() => {}}
        labels={labels}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Dark' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Light')).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(
      <ThemeToggle
        resolved="dark"
        explicit
        onToggle={onToggle}
        onUseSystem={() => {}}
        labels={labels}
      />,
    );
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('shows useSystem only when explicit', async () => {
    const onUseSystem = vi.fn();
    const { rerender } = render(
      <ThemeToggle
        resolved="dark"
        explicit={false}
        onToggle={() => {}}
        onUseSystem={onUseSystem}
        labels={labels}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Use system setting' })).not.toBeInTheDocument();

    rerender(
      <ThemeToggle
        resolved="dark"
        explicit
        onToggle={() => {}}
        onUseSystem={onUseSystem}
        labels={labels}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Use system setting' }));
    expect(onUseSystem).toHaveBeenCalledOnce();
  });
});
