// =============================================================================
// Redis client — Upstash (production) or local JSON fallback (dev)
// Env vars needed on Vercel:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// These are auto-injected when you connect Upstash via Vercel marketplace.
// =============================================================================

import type { ResultsData } from '@/lib/types';

function isUpstashConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function getResults(): Promise<ResultsData> {
  if (isUpstashConfigured()) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return (await redis.get<ResultsData>('ca_results')) ?? {};
  }

  // Local dev fallback — read from JSON file
  const fs = await import('fs');
  const path = await import('path');
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'results.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setResults(data: ResultsData): Promise<void> {
  if (isUpstashConfigured()) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set('ca_results', data);
    return;
  }

  // Local dev fallback — write to JSON file
  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'results.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}
