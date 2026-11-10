import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberStepper } from './NumberStepper';

describe('NumberStepper', () => {
  it.each([
    ['', 'Increase', '1'],
    ['', 'Decrease', '-1'],
    ['-', 'Increase', '1'],
    ['3', 'Increase', '4'],
    ['3', 'Decrease', '2'],
    ['-1', 'Decrease', '-2'],
  ])('+/- from %j (%s) gives %j, treating empty as 0', async (value, button, expected) => {
    const onChange = vi.fn();
    render(<NumberStepper label="Shift" value={value} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: button }));
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('passes typed text through as is, so "-" mid-typing is allowed', async () => {
    const onChange = vi.fn();
    render(<NumberStepper label="Shift" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Shift'), '-');
    expect(onChange).toHaveBeenCalledWith('-');
  });

  it('shows the error and marks the input invalid', () => {
    render(
      <NumberStepper label="Shift" value="-" onChange={() => {}} error="Enter a whole number." />,
    );
    const input = screen.getByLabelText('Shift');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a whole number.');
  });
});
