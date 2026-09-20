// Free translation via MyMemory API with localStorage caching.
// Limit: ~1000 words/day anonymous, 50k with valid email.

const CACHE_KEY = 'translation-cache-v1';

function getCache(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

const inflight = new Map<string, Promise<string>>();

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  const cacheKey = `${targetLang}::${trimmed}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey];

  if (inflight.has(cacheKey)) return inflight.get(cacheKey)!;

  const promise = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${targetLang}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated: string = data?.responseData?.translatedText || text;
      const fresh = getCache();
      fresh[cacheKey] = translated;
      setCache(fresh);
      return translated;
    } catch {
      return text;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}
