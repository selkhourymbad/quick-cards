import { useEffect, useState, MouseEvent } from "react";
import { dbService, authService, UserProfile, Deck } from "../lib/supabase";
import { Plus, BookOpen, Trash2, GraduationCap, ChevronRight, LogOut, Calendar, Layers, Sparkles } from "lucide-react";
import SupabaseIndicator from "./SupabaseIndicator";

interface MyDecksScreenProps {
  user: UserProfile;
  onLogout: () => void;
  onCreateDeckTrigger: () => void;
  onReviewDeckTrigger: (deck: Deck) => void;
}

export default function MyDecksScreen({
  user,
  onLogout,
  onCreateDeckTrigger,
  onReviewDeckTrigger
}: MyDecksScreenProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDecks = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { decks: fetchedDecks, error } = await dbService.fetchDecks(user.id);
      if (error) {
        setErrorMsg("Could not fetch decks: " + error.message);
      } else {
        setDecks(fetchedDecks);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to database client.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [user.id]);

  const handleDelete = async (e: MouseEvent, deckId: string) => {
    e.stopPropagation(); // Avoid triggering review click
    if (!confirm("Are you sure you want to delete this deck? This will remove all generated cards from memory.")) {
      return;
    }

    setDeletingId(deckId);
    try {
      const { success, error } = await dbService.deleteDeck(deckId);
      if (error) {
        alert("Error deleting deck: " + error.message);
      } else if (success) {
        setDecks(prev => prev.filter(d => d.id !== deckId));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    const error = await authService.signOut();
    if (error) {
      console.error(error);
    }
    onLogout();
  };

  // Human friendly formatting for dates
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" id="dashboard-layout-container">
      {/* Premium Compact Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 shadow-xs" id="dashboard-navbar shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between" id="nav-inner-box">
          <div className="flex items-center gap-2.5" id="brand-logo-area">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">QuickCards</h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide font-mono uppercase">AI Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3" id="nav-controls">
            <SupabaseIndicator />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Sign Out"
              id="logout-nav-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6" id="dashboard-main-content">
        
        {/* Profile Card / Hero Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in" id="dashboard-hero">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Dashboard</span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight pt-1.5">Welcome, {user.email.split("@")[0]}</h2>
            <p className="text-sm text-gray-500 max-w-md antialiased leading-relaxed">
              Review your compiled study decks, delete old materials, or click below to transform new materials instantly.
            </p>
          </div>
          <button
            onClick={onCreateDeckTrigger}
            className="self-start md:self-center flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-indigo-100 transition-all cursor-pointer group shrink-0"
            id="create-deck-top-trigger-btn"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>＋ New Study Deck</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-sm" id="dashboard-error-alert" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between" id="section-header-decks">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">My Saved Decks</h3>
          </div>
          <div className="text-xs text-gray-500 font-mono font-medium">
            {decks.length} {decks.length === 1 ? "Deck" : "Decks"} Saved
          </div>
        </div>

        {/* Decks Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3" id="decks-loading-placeholder">
            <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500 font-medium">Loading your study collections...</span>
          </div>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-up" id="decks-grid">
            {decks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => onReviewDeckTrigger(deck)}
                className="bg-white hover:bg-zinc-50/50 border border-gray-100 hover:border-gray-200 rounded-2xl shadow-xs hover:shadow-sm p-5 cursor-pointer flex flex-col justify-between h-44 transition-all duration-200 relative group"
                id={`deck-${deck.id}`}
              >
                {/* Upper part */}
                <div className="space-y-1.5 pr-8">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(deck.created_at)}</span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {deck.title}
                  </h4>
                </div>

                {/* Lower metadata + Actions */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-4" id="deck-metadata-row">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold" id="card-count-indicator">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{deck.card_count || 0} cards</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(e, deck.id)}
                      disabled={deletingId === deck.id}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete study deck"
                      aria-label="Delete deck"
                      id={`delete-deck-btn-${deck.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white border border-gray-100 rounded-3xl py-14 px-6 text-center text-gray-500 shadow-xs flex flex-col items-center justify-center gap-4 animate-fade-in" id="empty-decks-box">
            <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 shadow-sm">
              <Plus className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-lg font-bold text-gray-900">No study decks active</h4>
              <p className="text-sm text-gray-500 antialiased leading-relaxed">
                You haven't generated any study decks yet. Paste your lecture notes or upload a PDF to let the AI build flashcards for you!
              </p>
            </div>
            <button
              onClick={onCreateDeckTrigger}
              className="mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-xs transition-transform hover:scale-102 cursor-pointer"
              id="empty-create-deck-trigger-btn"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Create my first deck</span>
            </button>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 mt-12 bg-gray-50 border-t border-gray-100" id="dashboard-footer">
        <p>© 2026 QuickCards. Designed for high performance learning.</p>
      </footer>
    </div>
  );
}
