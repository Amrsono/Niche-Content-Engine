import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendHeatmap } from './TrendHeatmap';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  Map: () => <span data-testid="icon-map" />,
  Flame: () => <span data-testid="icon-flame" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
}));

describe('TrendHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, trends: [] }),
    });
  });

  it('renders the heatmap heading', () => {
    render(<TrendHeatmap />);
    expect(screen.getByText(/Global Pulse Heatmap/i)).toBeDefined();
  });

  it('shows loading spinner initially', () => {
    render(<TrendHeatmap />);
    // Spinner rendered via CSS class; check absence of LIVE badge before data loads
    const live = screen.queryByText('LIVE');
    expect(live).toBeNull();
  });

  it('uses logger.error when fetch fails', async () => {
    const { logger } = await import('@/lib/logger');
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<TrendHeatmap />);
    // Give async useEffect a tick to run
    await new Promise(r => setTimeout(r, 50));
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'Heatmap fetch failed',
      'TrendHeatmap',
      expect.any(Error)
    );
  });
});
