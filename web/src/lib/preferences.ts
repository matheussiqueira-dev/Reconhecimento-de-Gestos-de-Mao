export type DemoPreferences = {
  readonly mirror: boolean;
  readonly showLandmarks: boolean;
};

export const DEFAULT_PREFERENCES: DemoPreferences = { mirror: true, showLandmarks: true };

const STORAGE_KEY = "gestos-de-mao:preferences:v1";

let cached: DemoPreferences | null = null;
const listeners = new Set<() => void>();

/** Saved preferences; storage can be blocked or hold anything, so validate it. */
function read(): DemoPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;
    const record = parsed as Record<string, unknown>;
    return {
      mirror: typeof record.mirror === "boolean" ? record.mirror : DEFAULT_PREFERENCES.mirror,
      showLandmarks:
        typeof record.showLandmarks === "boolean"
          ? record.showLandmarks
          : DEFAULT_PREFERENCES.showLandmarks,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** useSyncExternalStore API: the server and the first client render use the defaults. */
export const preferencesStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): DemoPreferences {
    cached ??= read();
    return cached;
  },
  getServerSnapshot(): DemoPreferences {
    return DEFAULT_PREFERENCES;
  },
  update(change: Partial<DemoPreferences>): void {
    cached = { ...preferencesStore.getSnapshot(), ...change };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // Private mode or blocked storage: the preference only lasts for this visit.
    }
    for (const listener of listeners) listener();
  },
};
