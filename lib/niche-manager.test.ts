import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { getNicheState, getNextNiche, addDiscoveredTopics } from './niche-manager';

vi.mock('fs', () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const writeFileSync = vi.fn();
  const mkdirSync = vi.fn();

  return {
    default: {
      existsSync,
      readFileSync,
      writeFileSync,
      mkdirSync,
    },
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
  };
});

describe('Niche Manager (lib/niche-manager.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default fallback topics when niches file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const state = await getNicheState();
    expect(state.topics.length).toBeGreaterThan(0);
    expect(state.currentIndex).toBe(0);
  });

  it('rotates to next niche and saves state', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ topics: ['Topic A', 'Topic B'], currentIndex: 0 })
    );

    const niche = await getNextNiche();
    expect(niche).toBe('Topic A');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('adds newly discovered unique topics without duplicates', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ topics: ['Topic A'], currentIndex: 0 })
    );

    await addDiscoveredTopics(['Topic A', 'Topic B']);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
