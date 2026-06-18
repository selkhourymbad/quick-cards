import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase credentials from client-side environment variables
const initialUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const initialAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const checkValidCreds = (url: string | undefined, key: string | undefined) => {
  return !!(
    url && 
    key && 
    url !== "YOUR_SUPABASE_URL" && 
    key !== "YOUR_SUPABASE_ANON_KEY"
  );
};

// Check if credentials are set and not placeholders
export let isConfigured = checkValidCreds(initialUrl, initialAnonKey);

// Real Supabase client instance (or null if not configured)
export let supabase = isConfigured 
  ? createClient(initialUrl, initialAnonKey) 
  : null;

// Function to dynamically initialize Supabase client if not configured at build time
export const initializeSupabase = async () => {
  if (isConfigured && supabase) {
    return;
  }

  try {
    const res = await fetch("/api/supabase-config");
    if (res.ok) {
      const data = await res.json();
      const url = data.supabaseUrl;
      const key = data.supabaseAnonKey;
      
      if (checkValidCreds(url, key)) {
        supabase = createClient(url, key);
        isConfigured = true;
        console.log("[Supabase] Configuration dynamically loaded from server successfully.");
      } else {
        console.log("[Supabase] Active environment configs not found on server. Using local storage fallback mode.");
      }
    }
  } catch (err) {
    console.warn("[Supabase] Dynamic configuration loading failed:", err);
  }
};

// Standard types
export interface UserProfile {
  id: string;
  email: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  card_count?: number;
}

export interface Card {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
}

// -------------------------------------------------------------
// Fallback Local Storage Simulation Engine
// This ensures the application works immediately for AI Studio previews,
// while being fully ready to connect and persist in a live Supabase account!
// -------------------------------------------------------------
const STORAGE_PREFIX = "quickcards_";

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalData = (key: string, value: any) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error("Local Storage Write Error:", e);
  }
};

// Simulated Database Collections
let localUsers: UserProfile[] = getLocalData<UserProfile[]>("users", [
  { id: "default-user-id", email: "student@quickcards.io" }
]);

let localDecks: Deck[] = getLocalData<Deck[]>("decks", [
  {
    id: "deck-1",
    user_id: "default-user-id",
    title: "JavaScript Fundamentals",
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: "deck-2",
    user_id: "default-user-id",
    title: "React Hooks Quick Study",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
]);

let localCards: Card[] = getLocalData<Card[]>("cards", [
  { id: "c1", deck_id: "deck-1", question: "What is a closure in JavaScript?", answer: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment)." },
  { id: "c2", deck_id: "deck-1", question: "What is the difference between let and var?", answer: "let is block-scoped, whereas var is function-scoped. let does not hoist with undefined and does not create properties on global window." },
  { id: "c3", deck_id: "deck-1", question: "What are JavaScript primitive types?", answer: "string, number, bigint, boolean, undefined, symbol, and null." },
  { id: "c4", deck_id: "deck-2", question: "When should you use the useEffect hook?", answer: "To perform side-effects in functional components, such as data fetching, subscriptions, manual DOM mutations, and setting timers." },
  { id: "c5", deck_id: "deck-2", question: "What rule must be followed for Hook names?", answer: "Hooks must always start with the word 'use' (rules of hooks: only call hook at top level, only from React function components)." }
]);

let currentUser: UserProfile | null = getLocalData<UserProfile | null>("current_user", localUsers[0]);

// -------------------------------------------------------------
// Unified Database / Authentication Service API
// -------------------------------------------------------------
export const authService = {
  async getSessionUser(): Promise<UserProfile | null> {
    if (isConfigured && supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase Auth Fetch Error:", error);
      }
      if (session?.user) {
        return { id: session.user.id, email: session.user.email || "" };
      }
      return null;
    } else {
      return currentUser;
    }
  },

  async signUp(email: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { user: null, error };
      if (data.user) {
        return { user: { id: data.user.id, email: data.user.email || "" }, error: null };
      }
      return { user: null, error: new Error("Empty user returned on sign-up") };
    } else {
      if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, error: new Error("An account with this email already exists.") };
      }
      if (password.length < 6) {
        return { user: null, error: new Error("Password must be at least 6 characters.") };
      }
      const newUser: UserProfile = { id: `user-${Date.now()}`, email };
      localUsers.push(newUser);
      setLocalData("users", localUsers);
      currentUser = newUser;
      setLocalData("current_user", currentUser);
      return { user: newUser, error: null };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error };
      if (data.user) {
        return { user: { id: data.user.id, email: data.user.email || "" }, error: null };
      }
      return { user: null, error: new Error("Empty user returned on sign-in") };
    } else {
      const match = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!match) {
        return { user: null, error: new Error("Invalid login credentials") };
      }
      currentUser = match;
      setLocalData("current_user", currentUser);
      return { user: match, error: null };
    }
  },

  async signOut(): Promise<Error | null> {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      return error || null;
    } else {
      currentUser = null;
      setLocalData("current_user", null);
      return null;
    }
  }
};

export const dbService = {
  async fetchDecks(userId: string): Promise<{ decks: Deck[]; error: Error | null }> {
    if (isConfigured && supabase) {
      try {
        const { data: decksData, error: decksError } = await supabase
          .from("decks")
          .select("*")
          .order("created_at", { ascending: false });

        if (decksError) throw decksError;

        // Perform count queries for cards
        const formattedDecks: Deck[] = [];
        for (const deck of (decksData || [])) {
          const { count, error: countErr } = await supabase
            .from("cards")
            .select("*", { count: "exact", head: true })
            .eq("deck_id", deck.id);

          formattedDecks.push({
            ...deck,
            card_count: countErr ? 0 : (count || 0)
          });
        }

        return { decks: formattedDecks, error: null };
      } catch (err: any) {
        return { decks: [], error: err };
      }
    } else {
      const userDecks = localDecks.filter(d => d.user_id === userId);
      const decksWithCounts = userDecks.map(deck => ({
        ...deck,
        card_count: localCards.filter(c => c.deck_id === deck.id).length
      }));
      // Sort in reverse chronological order
      decksWithCounts.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { decks: decksWithCounts, error: null };
    }
  },

  async createDeck(userId: string, title: string, cards: { question: string; answer: string }[]): Promise<{ deck: Deck | null; error: Error | null }> {
    if (isConfigured && supabase) {
      try {
        const { data: deckData, error: deckError } = await supabase
          .from("decks")
          .insert([{ title, user_id: userId }])
          .select()
          .single();

        if (deckError) throw deckError;
        if (!deckData) throw new Error("Could not create deck record");

        const cardsToInsert = cards.map(card => ({
          deck_id: deckData.id,
          question: card.question,
          answer: card.answer
        }));

        const { error: cardsError } = await supabase
          .from("cards")
          .insert(cardsToInsert);

        if (cardsError) {
          // Attempt rollback
          await supabase.from("decks").delete().eq("id", deckData.id);
          throw cardsError;
        }

        return {
          deck: { ...deckData, card_count: cards.length },
          error: null
        };
      } catch (err: any) {
        return { deck: null, error: err };
      }
    } else {
      const newDeckId = `deck-${Date.now()}`;
      const newDeck: Deck = {
        id: newDeckId,
        user_id: userId,
        title: title || "Study Notes Deck",
        created_at: new Date().toISOString()
      };

      const newCardsObj: Card[] = cards.map((c, i) => ({
        id: `card-${Date.now()}-${i}`,
        deck_id: newDeckId,
        question: c.question,
        answer: c.answer
      }));

      localDecks.unshift(newDeck);
      localCards.push(...newCardsObj);

      setLocalData("decks", localDecks);
      setLocalData("cards", localCards);

      return {
        deck: { ...newDeck, card_count: cards.length },
        error: null
      };
    }
  },

  async deleteDeck(deckId: string): Promise<{ success: boolean; error: Error | null }> {
    if (isConfigured && supabase) {
      try {
        // Since cascade might not be configured, delete cards first
        const { error: cardsErr } = await supabase
          .from("cards")
          .delete()
          .eq("deck_id", deckId);

        if (cardsErr) throw cardsErr;

        const { error: deckErr } = await supabase
          .from("decks")
          .delete()
          .eq("id", deckId);

        if (deckErr) throw deckErr;

        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err };
      }
    } else {
      localDecks = localDecks.filter(d => d.id !== deckId);
      localCards = localCards.filter(c => c.deck_id !== deckId);

      setLocalData("decks", localDecks);
      setLocalData("cards", localCards);

      return { success: true, error: null };
    }
  },

  async fetchCards(deckId: string): Promise<{ cards: Card[]; error: Error | null }> {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("cards")
          .select("*")
          .eq("deck_id", deckId);

        if (error) throw error;
        return { cards: data || [], error: null };
      } catch (err: any) {
        return { cards: [], error: err };
      }
    } else {
      const filtered = localCards.filter(c => c.deck_id === deckId);
      return { cards: filtered, error: null };
    }
  }
};
