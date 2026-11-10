import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InlineMessage } from './InlineMessage';

describe('InlineMessage', () => {
  it('renders the apiMessage in mono-small', () => {
    render(
      <InlineMessage
        tone="error"
        title="Check the key"
        body="The key does not fit this cipher."
        apiMessage="key must be 64 hex characters"
      />,
    );
    expect(screen.getByText('Check the key')).toBeInTheDocument();
    expect(screen.getByText('The key does not fit this cipher.')).toBeInTheDocument();
    expect(screen.getByText('key must be 64 hex characters')).toHaveClass('text-mono-small');
  });

  it.each([
    ['info', 'status'],
    ['warning', 'status'],
    ['error', 'alert'],
  ] as const)('tone %s uses role="%s"', (tone, role) => {
    render(<InlineMessage tone={tone} title="Heads up" />);
    expect(screen.getByRole(role)).toHaveTextContent('Heads up');
  });

  it('omits body and apiMessage when they are null', () => {
    const { container } = render(
      <InlineMessage tone="info" title="Heads up" body={null} apiMessage={null} />,
    );
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
