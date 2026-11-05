import { useState } from "react";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import CasePage from "./pages/CasePage";
import { useCase } from "./hooks/useCase";
import { emptyCase, sampleCase } from "./lib/docs";

export default function App() {
  const { state, update, replace, reset, hasSaved } = useCase();
  const [view, setView] = useState<"landing" | "case">("landing");
  const [step, setStep] = useState(1);

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0 }); };

  return (
    <AppLayout onHome={() => setView("landing")}>
      {view === "landing" ? (
        <Landing
          onStart={() => { replace(emptyCase()); go(1); setView("case"); }}
          onSample={() => { replace(sampleCase()); go(2); setView("case"); }}
          onResume={hasSaved || state.isSample ? () => { go(1); setView("case"); } : null}
        />
      ) : (
        <CasePage
          state={state}
          update={update}
          replace={replace}
          step={step}
          setStep={go}
          onReset={() => { reset(); setView("landing"); }}
        />
      )}
    </AppLayout>
  );
}
