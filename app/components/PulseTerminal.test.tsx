import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PulseTerminal } from './PulseTerminal';

vi.mock('@/lib/ai/utils', () => ({
  stringifyError: (err: unknown) => String(err),
}));

vi.mock('lucide-react', () => ({
  Terminal: () => <span data-testid="icon-terminal" />,
  Play: () => <span data-testid="icon-play" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

describe('PulseTerminal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the terminal heading', () => {
    render(<PulseTerminal />);
    expect(screen.getByText(/Agent Pulse Terminal/i)).toBeDefined();
  });

  it('shows idle message when no logs are present', () => {
    render(<PulseTerminal />);
    expect(screen.getByText(/System idle/i)).toBeDefined();
  });

  it('renders a Start Cycle button', () => {
    render(<PulseTerminal />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('Start Cycle');
  });

  it('renders a Bulk Mode checkbox', () => {
    render(<PulseTerminal />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
  });
});
