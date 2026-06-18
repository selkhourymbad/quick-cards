import { useState, DragEvent, useRef, ChangeEvent } from "react";
import { ArrowLeft, Upload, FileText, X, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import SupabaseIndicator from "./SupabaseIndicator";

interface CreateDeckScreenProps {
  onBack: () => void;
  onStartGeneration: (payload: { title: string; notes: string; file: { data: string; mimeType: string } | null }) => void;
}

export default function CreateDeckScreen({ onBack, onStartGeneration }: CreateDeckScreenProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [fileData, setFileData] = useState<{ filename: string; size: string; data: string; mimeType: string } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format byte sizes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);

    // Size limit check (e.g., 8MB limit for stable serverless processing)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("File is too large (max 8MB). Please choose a shorter document.");
      return;
    }

    const filename = file.name;
    const size = formatBytes(file.size);
    const mimeType = file.type || "application/octet-stream";

    const reader = new FileReader();

    if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
      // For plain text files, read directly as text and fill the notes textarea, or keep as text
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        // Merge text into notes for superior coverage
        setNotes(prev => prev ? `${prev}\n\n--- Source: ${filename} ---\n${textContent}` : textContent);
        // Also show badge
        setFileData({
          filename,
          size,
          data: btoa(unescape(encodeURIComponent(textContent))), // safe text base64 encoding
          mimeType: "text/plain"
        });
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // For PDFs, convert to Base64 so Gemini can natively parse the actual documents
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(",")[1];
        setFileData({
          filename,
          size,
          data: base64Data,
          mimeType: "application/pdf"
        });
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg(`Unsupported file type: ${file.name}. Please upload PDF, TXT or MD study documents.`);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFileZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = () => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide a title for this flashcard deck.");
      return;
    }

    if (!notes.trim() && !fileData) {
      setErrorMsg("Please paste some study note paragraphs or upload a lecture PDF first.");
      return;
    }

    onStartGeneration({
      title: title.trim(),
      notes: notes.trim(),
      file: fileData ? { data: fileData.data, mimeType: fileData.mimeType } : null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" id="create-layout-container">
      {/* Navbar header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-xs" id="create-navbar">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer group"
            id="back-to-decks-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>My Decks</span>
          </button>
          
          <div className="flex items-center gap-3">
            <SupabaseIndicator />
          </div>
        </div>
      </header>

      {/* Primary Workspace */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6" id="create-main-content">
        
        {/* Title Area */}
        <div className="space-y-1.5 animate-fade-in" id="workspace-intro">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create AI Flashcard Deck</h2>
          <p className="text-sm text-gray-500 max-w-xl">
            Input study guides, bullet points, or upload textbook chapters. Our state-of-the-art AI synthesized model builds robust, study-optimized flashcards instantly.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm flex items-start gap-2.5 shadow-xs" id="creator-error-alert" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 animate-scale-up" id="creation-form">
          {/* Deck Title */}
          <div className="space-y-2">
            <label htmlFor="deck-title-input" className="block text-sm font-bold text-gray-800">
              Deck Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="deck-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Midterm - Chapter 4, Economics Lecture 3"
              className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-hidden text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
            />
          </div>

          {/* Paste Notes Text Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="notes-textarea" className="block text-sm font-bold text-gray-800">
                Study Notes / Lecture Content
              </label>
              <span className="text-xs text-gray-400 font-medium">
                {notes.length} characters
              </span>
            </div>
            <textarea
              id="notes-textarea"
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste definitions, formulas, study copy, or general lecture transcripts here..."
              className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-hidden text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white leading-relaxed resize-y"
            />
          </div>

          {/* Divider style */}
          <div className="relative flex py-2 items-center" id="form-field-separator">
            <div className="flex-grow border-t border-gray-150"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-white z-10">OR</span>
            <div className="flex-grow border-t border-gray-150"></div>
          </div>

          {/* File Upload Zone */}
          <div className="space-y-2" id="drag-drop-container">
            <label className="block text-sm font-bold text-gray-800">
              Upload Study Material (PDF, TXT, MD)
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt,.md"
              className="hidden"
              id="hidden-file-picker"
            />

            {!fileData ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileZoneClick}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                id="interactive-drag-zone"
              >
                <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 mb-3 group-hover:scale-105 transition-transform" id="upload-icon-box">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-800">Drag & drop your study document, or <span className="text-indigo-600 hover:text-indigo-700 font-bold underline">browse files</span></p>
                  <p className="text-xs text-gray-400">PDF, TXT, or Markdown documents up to 8MB are natively supported.</p>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4 animate-scale-up" id="active-file-badge">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md">{fileData.filename}</p>
                    <p className="text-xs text-indigo-700/80 font-semibold font-mono">{fileData.size} • {fileData.mimeType.includes("pdf") ? "Portable Document" : "Plain Text"}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-950 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove file"
                  aria-label="Remove attached file"
                  id="remove-uploaded-file-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Generate Button Row */}
          <div className="pt-4 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="form-actions-box">
            <span className="text-xs text-gray-400 max-w-sm leading-relaxed flex items-start gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
              <span>Generating larger files can take up to 20 seconds. All cards will be saved instantly with zero text loss.</span>
            </span>

            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-indigo-100 transition-all cursor-pointer group uppercase tracking-wide text-xs"
              id="generate-deck-btn"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 group-hover:animate-pulse" />
              <span>Generate Flashcards</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
