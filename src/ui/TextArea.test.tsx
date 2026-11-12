import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextArea } from './TextArea';

function Controlled({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <TextArea label="Text" counter value={value} onChange={(e) => setValue(e.target.value)} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </>
  );
}

describe('TextArea', () => {
  it('preserves leading/trailing whitespace in its value', async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText('Text'), '  hello  ');
    expect(screen.getByTestId('value')).toHaveTextContent('"  hello  "', {
      normalizeWhitespace: false,
    });
    expect(screen.getByLabelText('Text')).toHaveValue('  hello  ');
  });

  it('counts characters, including spaces and emoji as one each', () => {
    render(<Controlled initial=" a😀 " />);
    expect(screen.getByText('4 characters')).toBeInTheDocument();
  });

  it('counts joined emoji, flags and skin tones as one character each', () => {
    render(<Controlled initial="👩‍💻🇧🇷👍🏽" />);
    expect(screen.getByText('3 characters')).toBeInTheDocument();
  });

  it('can keep its label for assistive tech only', () => {
    render(<TextArea label="Input" labelHidden />);
    expect(screen.getByRole('textbox', { name: 'Input' })).toBeInTheDocument();
    expect(screen.getByText('Input')).toHaveClass('sr-only');
  });

  it('shows the note and turns off spellcheck', () => {
    render(<TextArea label="Text" note="Spaces count" />);
    expect(screen.getByText('Spaces count')).toBeInTheDocument();
    expect(screen.getByLabelText('Text')).toHaveAttribute('spellcheck', 'false');
  });

  it('grows with its content', async () => {
    render(<Controlled />);
    const area = screen.getByLabelText<HTMLTextAreaElement>('Text');
    Object.defineProperty(area, 'scrollHeight', { configurable: true, get: () => 180 });
    await userEvent.type(area, 'x');
    expect(area.style.height).toBe('180px');
  });

  describe('when its width changes', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('recomputes its height, so rewrapped lines are not clipped', () => {
      let notify: () => void = () => {};
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: () => void) {
            notify = callback;
          }
          observe() {}
          disconnect() {}
        },
      );
      render(<Controlled initial={'a long line of ciphertext'} />);
      const area = screen.getByLabelText<HTMLTextAreaElement>('Text');
      Object.defineProperty(area, 'scrollHeight', { configurable: true, get: () => 240 });
      notify();
      expect(area.style.height).toBe('240px');
    });
  });

  it('announces the count once typing pauses, not on every keystroke', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const { container } = render(<Controlled />);
      const status = container.querySelector('[role="status"]');
      expect(status).toBeEmptyDOMElement();
      for (const text of ['a', 'ab', 'abc']) {
        fireEvent.change(screen.getByLabelText('Text'), { target: { value: text } });
        act(() => vi.advanceTimersByTime(200));
      }
      expect(status).toBeEmptyDOMElement();
      act(() => vi.advanceTimersByTime(1000));
      expect(status).toHaveTextContent('3 characters');
    } finally {
      vi.useRealTimers();
    }
  });

  it('counts only when the counter is shown', async () => {
    const segment = vi.spyOn(Intl.Segmenter.prototype, 'segment');
    try {
      render(<TextArea label="Text" defaultValue="hello" />);
      await userEvent.type(screen.getByLabelText('Text'), ' world');
      expect(segment).not.toHaveBeenCalled();
    } finally {
      segment.mockRestore();
    }
  });
});
