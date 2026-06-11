import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Trace {
  id: string;
  place: string;
  kind: "shot" | "quest" | "meet";
  time: number; // epoch ms
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  x: number;
  y: number;
}

interface Persisted {
  name: string;
  shots: number;
  traces: Trace[];
  quests: Record<string, number>;
  crew: Member[];
  meetPoint: { x: number; y: number } | null;
}

// retained for data shape; the refined UI renders neutral avatars
const MEMBER_COLORS = ["var(--iz-ink)"];

// Everything starts empty — the app fills in only from the user's real,
// persisted actions. No seeded crew, no pre-filled quest progress.
const DEFAULT: Persisted = {
  name: "",
  shots: 0,
  traces: [],
  quests: { "1": 0, "2": 0, "3": 0, "4": 0 },
  crew: [],
  meetPoint: null,
};

const KEY = "iz-state-v2";

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "IZ";
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Store extends Persisted {
  spots: number;
  completedQuests: number;
  initialsOf: (name: string) => string;
  // actions
  setName: (name: string) => void;
  addShot: (place: string) => void;
  bumpQuest: (id: string, label: string) => number; // returns new progress
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  setMeetPoint: (p: { x: number; y: number } | null) => void;
  reset: () => void;
}

// Pin the context to a module-global so Fast Refresh reusing this file keeps the
// same Context instance and never desyncs the Provider from useStore consumers.
const g = globalThis as unknown as { __IZ_STORE_CTX__?: ReturnType<typeof createContext<Store | null>> };
const Ctx = g.__IZ_STORE_CTX__ ?? (g.__IZ_STORE_CTX__ = createContext<Store | null>(null));

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  const addTrace = (place: string, kind: Trace["kind"]) =>
    setState((s) => ({
      ...s,
      traces: [{ id: uid(), place, kind, time: Date.now() }, ...s.traces].slice(0, 20),
    }));

  const setName = (name: string) => setState((s) => ({ ...s, name }));

  const addShot = (place: string) => {
    setState((s) => ({
      ...s,
      shots: s.shots + 1,
      traces: [{ id: uid(), place, kind: "shot", time: Date.now() }, ...s.traces].slice(0, 20),
    }));
  };

  const bumpQuest = (id: string, label: string) => {
    const current = state.quests[id] ?? 0;
    const next = Math.min(100, current + 25);
    setState((s) => ({ ...s, quests: { ...s.quests, [id]: next } }));
    if (next === 100 && current < 100) addTrace(label, "quest");
    return next;
  };

  const addMember = (name: string) => {
    if (!name.trim()) return;
    setState((s) => ({
      ...s,
      crew: [
        ...s.crew,
        {
          id: uid(),
          name: name.trim(),
          initials: initials(name),
          color: MEMBER_COLORS[s.crew.length % MEMBER_COLORS.length],
          x: 20 + Math.random() * 60,
          y: 22 + Math.random() * 46,
        },
      ],
    }));
  };

  const removeMember = (id: string) =>
    setState((s) => ({ ...s, crew: s.crew.filter((m) => m.id !== id) }));

  const setMeetPoint = (p: { x: number; y: number } | null) => {
    setState((s) => ({ ...s, meetPoint: p }));
    if (p) addTrace("Meet point", "meet");
  };

  const reset = () => setState(DEFAULT);

  const spots = useMemo(() => new Set(state.traces.map((tr) => tr.place)).size, [state.traces]);
  const completedQuests = useMemo(
    () => Object.values(state.quests).filter((p) => p >= 100).length,
    [state.quests],
  );

  const value: Store = {
    ...state,
    spots,
    completedQuests,
    initialsOf: initials,
    setName,
    addShot,
    bumpQuest,
    addMember,
    removeMember,
    setMeetPoint,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within AppStateProvider");
  return ctx;
}

/** Short relative time label. */
export function relativeTime(ms: number, justNow: string) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return justNow;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
