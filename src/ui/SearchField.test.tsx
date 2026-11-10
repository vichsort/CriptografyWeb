import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('is a labelled search box that reports typing', async () => {
    const onChange = vi.fn();
    render(<SearchField value="" onChange={onChange} placeholder="Search" />);
    const box = screen.getByRole('searchbox', { name: 'Search' });
    await userEvent.type(box, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('focuses on "/" when shortcut set, ignoring "/" typed inside other inputs', async () => {
    render(
      <>
        <input aria-label="Other" />
        <SearchField value="" onChange={() => {}} placeholder="Search" shortcut="/" />
      </>,
    );
    const box = screen.getByRole('searchbox');
    const other = screen.getByLabelText('Other');

    other.focus();
    await userEvent.keyboard('/');
    expect(other).toHaveFocus();
    expect(other).toHaveValue('/');

    other.blur();
    await userEvent.keyboard('/');
    expect(box).toHaveFocus();
    expect(box).toHaveValue('');
  });

  it('ignores "/" without the shortcut, and with a modifier', async () => {
    const { rerender } = render(<SearchField value="" onChange={() => {}} placeholder="Search" />);
    await userEvent.keyboard('/');
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
    rerender(<SearchField value="" onChange={() => {}} placeholder="Search" shortcut="/" />);
    await userEvent.keyboard('{Control>}/{/Control}');
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
  });
});
