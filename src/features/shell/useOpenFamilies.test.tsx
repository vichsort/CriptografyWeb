import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useOpenFamilies } from './useOpenFamilies';

function Families() {
  return <p>{useOpenFamilies().join(',')}</p>;
}

describe('useOpenFamilies', () => {
  it('renders the default on the server, whatever this browser saved', () => {
    localStorage.setItem('cw:v1:sidebar.openFamilies', '["hashing"]');
    expect(renderToString(<Families />)).toContain('encryption');
  });

  it('reads the saved families in the browser', () => {
    localStorage.setItem('cw:v1:sidebar.openFamilies', '["hashing"]');
    render(<Families />);
    expect(screen.getByText('hashing')).toBeInTheDocument();
  });
});
