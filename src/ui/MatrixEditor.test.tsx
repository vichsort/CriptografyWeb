import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MatrixEditor } from './MatrixEditor';

function Editor({
  initial,
  onChange,
}: {
  initial: number[][];
  onChange?: (m: number[][]) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MatrixEditor
      label="Key matrix"
      value={value}
      min={2}
      max={3}
      onChange={(m) => {
        setValue(m);
        onChange?.(m);
      }}
      feedback={{ text: 'det(K) = 1', ok: true }}
    />
  );
}

const cell = (r: number, c: number) => screen.getByLabelText(`Row ${r}, column ${c}`);

describe('MatrixEditor', () => {
  it('grows 2→3 keeping existing values and filling identity', async () => {
    const onChange = vi.fn();
    render(
      <Editor
        initial={[
          [3, 3],
          [2, 5],
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Larger matrix' }));
    expect(onChange).toHaveBeenLastCalledWith([
      [3, 3, 0],
      [2, 5, 0],
      [0, 0, 1],
    ]);
    expect(cell(3, 3)).toHaveValue('1');
    expect(screen.getByText('3×3')).toBeInTheDocument();
  });

  it('never goes below min or above max', async () => {
    const onChange = vi.fn();
    render(
      <Editor
        initial={[
          [1, 0],
          [0, 1],
        ]}
        onChange={onChange}
      />,
    );
    const smaller = screen.getByRole('button', { name: 'Smaller matrix' });
    const larger = screen.getByRole('button', { name: 'Larger matrix' });
    expect(smaller).toBeDisabled();
    await userEvent.click(larger);
    expect(larger).toBeDisabled();
    await userEvent.click(smaller);
    expect(onChange).toHaveBeenLastCalledWith([
      [1, 0],
      [0, 1],
    ]);
  });

  it('arrow keys move between cells', async () => {
    render(
      <Editor
        initial={[
          [1, 2],
          [3, 4],
        ]}
      />,
    );
    cell(1, 1).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(cell(1, 2)).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(cell(2, 2)).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(cell(2, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(cell(1, 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(cell(1, 1)).toHaveFocus();
  });

  it('commits whole numbers and lets "-" stand while typing', async () => {
    const onChange = vi.fn();
    render(
      <Editor
        initial={[
          [1, 0],
          [0, 1],
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.clear(cell(1, 2));
    await userEvent.type(cell(1, 2), '-7');
    expect(cell(1, 2)).toHaveValue('-7');
    expect(onChange).toHaveBeenLastCalledWith([
      [1, -7],
      [0, 1],
    ]);
  });

  it('announces the feedback line', () => {
    render(
      <Editor
        initial={[
          [1, 0],
          [0, 1],
        ]}
      />,
    );
    expect(screen.getByText('det(K) = 1')).toHaveAttribute('aria-live', 'polite');
  });
});
