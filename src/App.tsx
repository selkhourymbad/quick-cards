import { useEffect, useState } from "react";
import { authService, dbService, UserProfile, Deck, Card } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";
import MyDecksScreen from "./components/MyDecksScreen";
import CreateDeckScreen from "./components/CreateDeckScreen";
import GeneratingScreen from "./components/GeneratingScreen";
import ReviewDeckScreen from "./components/ReviewDeckScreen";

type ActiveScreen = "login" | "dashboard" | "create" | "generating" | "review";

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>("login");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // States related to active deck review
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Card[]>([]);

  // Startup session recovery
  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await authService.getSessionUser();
        if (currentUser) {
          setUser(currentUser);
          setScreen("dashboard");
        } else {
          setScreen("login");
        }
      } catch (err) {
        console.error("Session lookup failure:", err);
        setScreen("login");
      } finally {
        setLoadingSession(false);
      }
    }
    checkSession();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setScreen("login");
    setSelectedDeck(null);
    setDeckCards([]);
  };

  const handleCreateDeckTrigger = () => {
    setScreen("create");
  };

  const handleReviewDeckTrigger = async (deck: Deck) => {
    setSelectedDeck(deck);
    setScreen("generating"); // temporary loader while fetching cards in background (very elegant!)
    
    try {
      const { cards, error } = await dbService.fetchCards(deck.id);
      if (error) {
        alert("Could not load flashcards: " + error.message);
        setScreen("dashboard");
      } else {
        setDeckCards(cards);
        setScreen("review");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      setScreen("dashboard");
    }
  };

  const handleStartGeneration = async (payload: { title: string; notes: string; file: { data: string; mimeType: string } | null }) => {
    if (!user) return;
    
    setScreen("generating");

    try {
      // POST payload to Express middleware API
      const result = await fetch("/api/generate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || "Flashcard AI pipeline returned an invalid response.");
      }

      const responseBody = await result.json();
      
      // Save generating outcome in database (unified between real Supabase and LocalStorage modes)
      const { deck: createdDeck, error } = await dbService.createDeck(
        user.id,
        responseBody.title || payload.title,
        responseBody.cards
      );

      if (error) {
        throw new Error("Could not store your generated cards: " + error.message);
      }

      if (createdDeck) {
        // Automatically load newly created deck in Review workspace! (Incredible UX)
        setSelectedDeck(createdDeck);
        const { cards } = await dbService.fetchCards(createdDeck.id);
        setDeckCards(cards);
        setScreen("review");
      } else {
        setScreen("dashboard");
      }
    } catch (err: any) {
      alert("Generation failed: " + err.message);
      setScreen("create");
    }
  };

  // Screen layout dispatcher
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans" id="app-booting-shield">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-gray-400 font-semibold font-mono tracking-wider">BOOTING QUICKCARDS ENGINE...</p>
        </div>
      </div>
    );
  }

  switch (screen) {
    case "login":
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    case "dashboard":
      return user ? (
        <MyDecksScreen
          user={user}
          onLogout={handleLogout}
          onCreateDeckTrigger={handleCreateDeckTrigger}
          onReviewDeckTrigger={handleReviewDeckTrigger}
        />
      ) : null;
    case "create":
      return (
        <CreateDeckScreen
          onBack={() => setScreen("dashboard")}
          onStartGeneration={handleStartGeneration}
        />
      );
    case "generating":
      return <GeneratingScreen />;
    case "review":
      return selectedDeck ? (
        <ReviewDeckScreen
          deck={selectedDeck}
          cards={deckCards}
          onBack={() => {
            setSelectedDeck(null);
            setDeckCards([]);
            setScreen("dashboard");
          }}
        />
      ) : null;
    default:
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
}
