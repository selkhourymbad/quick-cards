import { useState } from "react";
import { Deck, Card } from "../lib/supabase";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Award, BookOpen, Layers, RefreshCw, Star } from "lucide-react";
import SupabaseIndicator from "./SupabaseIndicator";

interface ReviewDeckScreenProps {
  deck: Deck;
  cards: Card[];
  onBack: () => void;
}

export default function ReviewDeckScreen({ deck, cards, onBack }: ReviewDeckScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState<Record<number, boolean>>({});
  const [resultsFinished, setResultsFinished] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans" id="review-empty-layout">
        <header className="bg-white border-b border-gray-100 px-4 py-4" id="review-empty-nav">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
              id="empty-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Dashboard</span>
            </button>
            <SupabaseIndicator />
          </div>
        </header>
        <main className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col justify-center items-center text-center space-y-4" id="review-empty-main">
          <div className="bg-red-50 p-4 rounded-full text-red-500 shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">This Deck contains no cards</h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Flashcards could not be processed for this title, or the deck creation was interrupted midway.
          </p>
          <button
            onClick={onBack}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
            id="empty-dashboard-return-btn"
          >
            Go back to dashboard
          </button>
        </main>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    // Mark card as viewed/studied when flipped for analytics
    setStudiedCount(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      // Brief delay to allow card to unflip before loading next content
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setResultsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 150);
    }
  };

  const handleRestart = () => {
    setIsFlipped(false);
    setResultsFinished(false);
    setTimeout(() => {
      setCurrentIndex(0);
      setStudiedCount({});
    }, 150);
  };

  // Progress metrics calculations
  const totalStudied = Object.keys(studiedCount).length;
  const progressPercent = Math.round(((currentIndex + (isFlipped ? 1 : 0)) / cards.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none" id="review-layout-container">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-xs" id="review-navbar">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer group"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Finished Study</span>
          </button>

          <div className="flex items-center gap-3">
            <SupabaseIndicator />
          </div>
        </div>
      </header>

      {/* Primary reviews workspace */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-center space-y-6 animate-fade-in" id="review-main-content">
        
        {!resultsFinished ? (
          <>
            {/* Header info */}
            <div className="text-center space-y-2" id="review-card-header">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Active Review</span>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight pt-1 px-4 truncate">{deck.title}</h2>
              
              {/* Progress counter */}
              <p className="text-xs text-gray-400 font-mono font-bold" id="card-progress-count">
                CARD {currentIndex + 1} OF {cards.length}
              </p>
            </div>

            {/* Interactive Progress Bar */}
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden" id="workspace-progress-track">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.max(4, Math.min(100, progressPercent))}%` }}
                id="workspace-progress-indicator"
              />
            </div>

            {/* Tap-To-Flip 3D Card assembly */}
            <div 
              onClick={handleFlip}
              className="w-full h-80 perspective-1000 cursor-pointer focus:outline-hidden"
              role="button"
              tabIndex={0}
              aria-label={`Flashcard front: ${currentCard.question}. Tap to flip.`}
              id={`interactive-flashcard-box-${currentIndex}`}
            >
              <div 
                className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                id="card-flipper-orbit"
              >
                {/* CARD FRONT (Question) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-xs backface-hidden"
                  id="card-face-front"
                >
                  <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-1">
                    <Star className="w-3 h-3 text-indigo-400" />
                    <span>Question Front</span>
                  </span>

                  <div className="flex-1 flex items-center justify-center py-4 px-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug break-words">
                      {currentCard.question}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 font-medium">
                    Tap card to reveal answer
                  </p>
                </div>

                {/* CARD BACK (Answer) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-indigo-600 rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-md rotate-y-180 backface-hidden"
                  id="card-face-back"
                >
                  <span className="text-[10px] font-bold text-indigo-200 font-mono uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Correct Answer Back</span>
                  </span>

                  <div className="flex-1 flex items-center justify-center py-4 px-2 overflow-y-auto">
                    <p className="text-sm sm:text-base font-semibold text-white leading-relaxed break-words">
                      {currentCard.answer}
                    </p>
                  </div>

                  <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
                    Tap card to unflip
                  </p>
                </div>
              </div>
            </div>

            {/* Under-Card Helper Info */}
            <div className="text-center" id="card-under-indicators">
              <span className="text-[11px] text-gray-400 font-medium">
                {isFlipped ? "⚡ Answer displayed" : "💡 Think of the definition first!"}
              </span>
            </div>

            {/* Navigation Action Buttons Row */}
            <div className="flex items-center gap-3" id="navigation-actions">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer"
                id="review-prev-btn"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-3 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform hover:scale-102 cursor-pointer"
                id="review-next-btn"
              >
                <span>{currentIndex === cards.length - 1 ? "Complete Review" : "Next Card"}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </>
        ) : (
          /* RESULT COMPLETE STATE SCREEN */
          <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center space-y-6 shadow-sm animate-scale-up" id="review-completion-board">
            
            {/* Visual Trophy Badge */}
            <div className="flex justify-center" id="trophy-box">
              <div className="relative inline-flex bg-amber-50 rounded-full p-5 text-amber-500 border border-amber-100 shadow-xs animate-bounce-custom">
                <Award className="w-10 h-10" />
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Completion titles */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Deck Review Finished!</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                Excellent persistence. Consistent intervals are the key tool to transfer facts from active working thoughts to long-term memory shelves.
              </p>
            </div>

            {/* Summary Metrics Row */}
            <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-gray-100" id="statistics-rack">
              <div className="border-r border-gray-150 space-y-0.5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Studied Cards</p>
                <span className="text-lg font-extrabold text-indigo-600 font-mono">
                  {totalStudied} / {cards.length}
                </span>
                <p className="text-[10px] text-gray-400">Total Cards</p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completion</p>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  {Math.round((totalStudied / cards.length) * 100)}%
                </span>
                <p className="text-[10px] text-gray-400">Retention Metric</p>
              </div>
            </div>

            {/* Finish Action Controls */}
            <div className="space-y-2 pt-2" id="completion-action-block">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-widest"
                id="restart-review-btn"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Study Deck Again</span>
              </button>

              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-widest"
                id="completion-back-dashboard-btn"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
