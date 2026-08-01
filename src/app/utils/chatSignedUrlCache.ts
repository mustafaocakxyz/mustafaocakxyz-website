/** Refresh before Supabase's 1h signed URL expiry. */
const TTL_MS = 55 * 60 * 1000;
const STORAGE_KEY = 'gelisim.chatSignedUrlCache.v1';

type CacheEntry = {
  url: string;
  expiresAt: number;
};

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();
let diskHydrated = false;

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  return !!entry && entry.expiresAt > Date.now();
}

function hydrateFromSession(): void {
  if (diskHydrated || typeof sessionStorage === 'undefined') {
    diskHydrated = true;
    return;
  }
  diskHydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [path, entry] of Object.entries(parsed)) {
      if (entry?.url && entry.expiresAt > now) {
        memory.set(path, entry);
      }
    }
  } catch {
    // ignore
  }
}

function persistToSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  const payload: Record<string, CacheEntry> = {};
  const now = Date.now();
  for (const [path, entry] of memory.entries()) {
    if (entry.expiresAt > now) payload[path] = entry;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function getCachedChatSignedUrlSync(path: string): string | null {
  hydrateFromSession();
  const entry = memory.get(path);
  return isFresh(entry) ? entry.url : null;
}

export async function getOrCreateChatSignedUrl(
  path: string,
  create: () => Promise<string>,
): Promise<string> {
  hydrateFromSession();

  const cached = memory.get(path);
  if (isFresh(cached)) return cached.url;

  const pending = inflight.get(path);
  if (pending) return pending;

  const promise = (async () => {
    const url = await create();
    memory.set(path, { url, expiresAt: Date.now() + TTL_MS });
    persistToSession();
    return url;
  })().finally(() => {
    inflight.delete(path);
  });

  inflight.set(path, promise);
  return promise;
}

export async function prefetchChatSignedUrls(
  paths: Array<string | null | undefined>,
  create: (path: string) => Promise<string>,
): Promise<void> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  await Promise.all(unique.map((path) => getOrCreateChatSignedUrl(path, () => create(path))));
}
