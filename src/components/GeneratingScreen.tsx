import { useEffect, useState } from "react";
import { Sparkles, Brain, GraduationCap, ArrowUpRight } from "lucide-react";

const STUDY_TIPS = [
  "Space out your review! Re-testing your knowledge tomorrow matches optimal cerebral spacing intervals.",
  "Try 'Active Recall'. Do not just read the answers—force your brain to reconstruct them first.",
  "Keep questions short! Simple, high-level cards build rapid conceptual indexing.",
  "Connect definitions to real-world analogies. It bridges memory anchors.",
  "Write mock questions. Testing others is the ultimate hack to deep understanding."
];

const LOADING_STEPS = [
  "Reading material contents...",
  "Running Google AI analysis...",
  "Drafting conceptual topics...",
  "Formatting core Q&A blocks...",
  "Compiling schema checks...",
  "Securing persistent database entries..."
];

export default function GeneratingScreen() {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Cycle tips every 4.5 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % STUDY_TIPS.length);
    }, 4500);

    return () => clearInterval(tipInterval);
  }, []);

  // Cycle loading steps every 2.5 seconds
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 font-sans select-none" id="loader-screen-container">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in" id="loader-inner-container">
        
        {/* Magic Glowing Logo Stack */}
        <div className="relative inline-flex items-center justify-center mb-4" id="glow-logo-assembly">
          {/* Animated decorative waves in back */}
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse scale-150"></div>
          <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl animate-pulse scale-200"></div>
          
          <div className="relative bg-white border border-gray-100 p-6 rounded-3xl shadow-lg text-indigo-600 animate-spin-custom">
            <Brain className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1.5 rounded-xl shadow-md rotate-12 scale-90 animate-bounce-custom">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-3" id="loader-title-piles">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Creating your flashcards…</h2>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-xs font-semibold text-indigo-700 font-mono" id="current-stage">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            <span>{LOADING_STEPS[currentStep]}</span>
          </div>

          <p className="text-xs text-gray-400 max-w-xs mx-auto antialiased">
            This can take a few seconds as the model reads, summarizes, and structures your Study material.
          </p>
        </div>

        {/* Dynamic Study Tip Board */}
        <div className="bg-white border border-gray-100/70 p-5 rounded-2xl shadow-xs text-left max-w-sm mx-auto space-y-2 relative overflow-hidden" id="tip-shelf">
          <div className="absolute top-0 right-0 p-2 bg-indigo-50/40 rounded-bl-xl text-indigo-500">
            <GraduationCap className="w-4 h-4" />
          </div>

          <p className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Pro Study Tip</p>
          <p className="text-xs text-gray-600 font-medium leading-relaxed animate-fade-in pr-4">
            "{STUDY_TIPS[currentTip]}"
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-40 bg-gray-200 h-1.5 rounded-full overflow-hidden mx-auto" id="fallback-progress-frame">
          <div className="bg-indigo-600 h-full rounded-full animate-progress-flow"></div>
        </div>
      </div>
    </div>
  );
}
