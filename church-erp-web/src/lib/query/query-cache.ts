type QueryCacheEntry<T> = {
  data?: T;
  expiresAt: number;
  promise?: Promise<T>;
};

type QueryCacheSnapshot<T> = {
  data?: T;
  isFresh: boolean;
};

type FetchCachedQueryOptions = {
  ttlMs?: number;
  force?: boolean;
};

const DEFAULT_QUERY_TTL_MS = 30_000;
const queryCache = new Map<string, QueryCacheEntry<unknown>>();

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeQueryValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeQueryValue(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const normalizedValue = normalizeQueryValue(
          (value as Record<string, unknown>)[key],
        );

        if (normalizedValue !== undefined) {
          accumulator[key] = normalizedValue;
        }

        return accumulator;
      }, {});
  }

  return value;
}

export function createQueryKey(scope: string, params?: unknown) {
  if (params === undefined) {
    return scope;
  }

  return `${scope}:${JSON.stringify(normalizeQueryValue(params))}`;
}

export function getCachedQuerySnapshot<T>(key: string): QueryCacheSnapshot<T> {
  if (!isBrowser()) {
    return {
      data: undefined,
      isFresh: false,
    };
  }

  const entry = queryCache.get(key) as QueryCacheEntry<T> | undefined;

  if (!entry || entry.data === undefined) {
    return {
      data: undefined,
      isFresh: false,
    };
  }

  return {
    data: entry.data,
    isFresh: entry.expiresAt > Date.now(),
  };
}

export async function fetchCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: FetchCachedQueryOptions,
): Promise<T> {
  if (!isBrowser()) {
    return fetcher();
  }

  const ttlMs = options?.ttlMs ?? DEFAULT_QUERY_TTL_MS;
  const currentTime = Date.now();
  const existingEntry = queryCache.get(key) as QueryCacheEntry<T> | undefined;

  if (!options?.force) {
    if (
      existingEntry?.data !== undefined &&
      existingEntry.expiresAt > currentTime
    ) {
      return existingEntry.data;
    }

    if (existingEntry?.promise) {
      return existingEntry.promise;
    }
  }

  const promise = fetcher()
    .then((data) => {
      queryCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
      });

      return data;
    })
    .catch((error) => {
      if (existingEntry) {
        queryCache.set(key, existingEntry);
      } else {
        queryCache.delete(key);
      }

      throw error;
    });

  queryCache.set(key, {
    data: existingEntry?.data,
    expiresAt: existingEntry?.expiresAt ?? 0,
    promise,
  });

  return promise.finally(() => {
    const currentEntry = queryCache.get(key) as QueryCacheEntry<T> | undefined;

    if (!currentEntry?.promise || currentEntry.promise !== promise) {
      return;
    }

    if (currentEntry.data === undefined) {
      queryCache.delete(key);
      return;
    }

    queryCache.set(key, {
      data: currentEntry.data,
      expiresAt: currentEntry.expiresAt,
    });
  });
}

export function invalidateQuery(key: string) {
  if (!isBrowser()) {
    return;
  }

  queryCache.delete(key);
}

export function invalidateQueryPrefix(prefix: string) {
  if (!isBrowser()) {
    return;
  }

  for (const key of queryCache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      queryCache.delete(key);
    }
  }
}
