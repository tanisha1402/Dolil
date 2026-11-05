import { useCallback, useEffect, useState } from "react";
import { emptyCase } from "../lib/docs";
import type { CaseState } from "../lib/types";

const KEY = "dolil.case.v1";

function load(): CaseState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as CaseState;
    return p && p.docs ? p : null;
  } catch {
    return null;
  }
}

export function useCase() {
  const [saved] = useState<CaseState | null>(load);
  const [state, setState] = useState<CaseState>(saved ?? emptyCase());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started && !saved) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state, started, saved]);

  const update = useCallback((fn: (c: CaseState) => CaseState) => { setStarted(true); setState(fn); }, []);
  const replace = useCallback((c: CaseState) => { setStarted(true); setState(c); }, []);
  const reset = useCallback(() => {
    setState(emptyCase());
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }, []);
  return { state, update, replace, reset, hasSaved: saved !== null };
}
