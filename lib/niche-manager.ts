import fs from 'fs';
import path from 'path';

const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.resolve(process.cwd(), 'data');
const NICHES_FILE = path.resolve(DATA_DIR, 'niches.json');

export interface NicheState {
  topics: string[];
  currentIndex: number;
}

export async function getNicheState(): Promise<NicheState> {
  try {
    if (!fs.existsSync(NICHES_FILE)) {
      // Default fallback topics
      return {
        topics: ['AI Chat Productivity', 'Smart Home Tech', 'Eco Friendly Gadgets', 'Future of Work Trends', 'FinTech Innovations'],
        currentIndex: 0
      };
    }
    const data = fs.readFileSync(NICHES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[NICHE MANAGER] Error reading state:', err);
    return { topics: ['AI Tech'], currentIndex: 0 };
  }
}

export async function saveNicheState(state: NicheState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NICHES_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('[NICHE MANAGER] Error saving state:', err);
  }
}

export async function getNextNiche(): Promise<string> {
  const state = await getNicheState();
  if (state.topics.length === 0) return 'Technology Trends'; // ultimate fallback

  const niche = state.topics[state.currentIndex % state.topics.length];
  
  // Advance index for next time
  state.currentIndex = (state.currentIndex + 1) % state.topics.length;
  await saveNicheState(state);
  
  return niche;
}

export async function addDiscoveredTopics(newTopics: string[]) {
  const state = await getNicheState();
  // Filter out duplicates
  const uniqueNew = newTopics.filter(t => !state.topics.includes(t));
  if (uniqueNew.length > 0) {
    state.topics = [...state.topics, ...uniqueNew];
    await saveNicheState(state);
    console.log(`[NICHE MANAGER] Added ${uniqueNew.length} new topics. Total is now ${state.topics.length}.`);
  }
}
