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

  it('left and right move the caret inside a cell, and leave it only at the edge', async () => {
    render(
      <Editor
        initial={[
          [123, 2],
          [3, 4],
        ]}
      />,
    );
    const first = cell(1, 1) as HTMLInputElement;
    first.focus();
    first.setSelectionRange(2, 2);
    await userEvent.keyboard('{ArrowLeft}');
    expect(first).toHaveFocus();
    expect(first.selectionStart).toBe(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(first).toHaveFocus();
    first.setSelectionRange(3, 3);
    await userEvent.keyboard('{ArrowRight}');
    expect(cell(1, 2)).toHaveFocus();
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

  it('keeps the live region mounted, so the first feedback is announced', () => {
    const props = {
      label: 'Key matrix',
      value: [
        [1, 0],
        [0, 1],
      ],
      min: 2,
      max: 6,
      onChange: () => {},
    };
    const { container, rerender } = render(<MatrixEditor {...props} feedback={null} />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region).toBeEmptyDOMElement();
    rerender(<MatrixEditor {...props} feedback={{ text: 'det(K) = 0', ok: false }} />);
    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region).toHaveTextContent('det(K) = 0');
  });
});
