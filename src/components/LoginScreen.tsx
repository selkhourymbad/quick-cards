import { useState, FormEvent } from "react";
import { authService, UserProfile } from "../lib/supabase";
import { Mail, Lock, LogIn, UserPlus, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import SupabaseIndicator from "./SupabaseIndicator";

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { user, error } = await authService.signUp(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else if (user) {
          onLoginSuccess(user);
        }
      } else {
        const { user, error } = await authService.signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else if (user) {
          onLoginSuccess(user);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="login-layout-container">
      {/* Top Header Badge Row */}
      <div className="absolute top-4 right-4" id="login-indicator-wrapper">
        <SupabaseIndicator />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md" id="login-landing-branding">
        <div className="flex justify-center" id="logo-icon-box">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg text-white animate-bounce-custom">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight" id="app-title">
          QuickCards
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w-xs mx-auto" id="app-subtitle">
          Supercharge your study flow. Let AI transform notes into personalized flashcards instantly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" id="login-form-card-container">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 rounded-3xl sm:px-10" id="login-wrapper-form">
          <div className="mb-6 flex space-x-2 bg-gray-100 p-1 rounded-xl" id="toggle-auth-container">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                !isSignUp
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              id="tab-signin-btn"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                isSignUp
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              id="tab-signup-btn"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5" id="auth-error-alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-normal">{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} id="authentication-form">
            <div>
              <label htmlFor="email-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl" id="email-field-box">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400 bg-gray-50/50 focus:bg-white text-gray-900 focus:outline-hidden transition-all"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl" id="password-field-box">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400 bg-gray-50/50 focus:bg-white text-gray-900 focus:outline-hidden transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                id="submit-auth-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5" id="auth-loading-spinner">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? "Creating account..." : "Accessing system..."}
                  </span>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Log In
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Prompt/Helper on default simulation data */}
          <div className="mt-6 text-center text-xs text-gray-400 max-w-xs mx-auto space-y-2 leading-relaxed" id="auth-sandbox-disclaimer">
            <span className="flex items-center justify-center gap-1.5 text-indigo-500/80 font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Full Sandbox Activated</span>
            </span>
            <p>You can use standard credentials (e.g. <b>student@quickcards.io</b> / <b>123456</b>) or sign up any test address immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
