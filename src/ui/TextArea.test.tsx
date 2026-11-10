import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
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
});
