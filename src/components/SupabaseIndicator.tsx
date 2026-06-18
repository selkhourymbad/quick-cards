import { useState } from "react";
import { isConfigured } from "../lib/supabase";
import { Database, HelpCircle, X, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SupabaseIndicator() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 shadow-sm ${
          isConfigured 
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/55" 
            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/55"
        }`}
        id="supabase-indicator-badge"
      >
        <span className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
        <Database className="w-3.5 h-3.5" />
        <span>DB: {isConfigured ? "Supabase Live" : "Local Sandbox"}</span>
        <HelpCircle className="w-3 h-3 text-current/70" />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="db-status-overlay">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative animate-scale-up" id="db-status-card">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
              aria-label="Close"
              id="close-db-status-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isConfigured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Database Connection Status</h3>
            </div>

            <div className="space-y-4 text-sm text-gray-600 leading-relaxed mb-6">
              {isConfigured ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-emerald-800 font-medium bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 mt-0.5 shrink-0" />
                    <span>QuickCards is successfully active and storing decks and user accounts on your live Supabase database.</span>
                  </div>
                  <p>All data and user records are synchronized securely in real time with Row Level Security (RLS) active.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-amber-800 font-medium bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <ShieldAlert className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 mb-0.5">Running in Local Sandbox Mode</p>
                      <p className="text-xs text-amber-800 font-normal">No database credentials provided. We have activated an intelligent offline storage sandbox so you can test all features (creation, review, registration) immediately!</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-100">
                    <p className="font-semibold text-gray-700">How to activate persistent Cloud storage with Supabase:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-1">
                      <li>Create or open a project on <span className="font-medium text-indigo-600">supabase.com</span></li>
                      <li>Go to <span className="font-medium text-gray-800">Project Settings &gt; API</span></li>
                      <li>Copy your <span className="font-medium text-gray-800">Project API URL</span> and <span className="font-medium text-gray-800">anon public key</span></li>
                      <li>Click <b>Settings &gt; Secrets</b> in this AI Studio panel, and add:</li>
                    </ol>
                    <div className="bg-white p-2 rounded border border-gray-200 font-mono text-[10px] space-y-1 text-gray-500 select-all leading-snug">
                      <div>VITE_SUPABASE_URL="your-supabase-url"</div>
                      <div>VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl transition-colors text-sm focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 focus:outline-hidden"
              id="db-modal-acknowledge-btn"
            >
              Continue studying
            </button>
          </div>
        </div>
      )}
    </>
  );
}
