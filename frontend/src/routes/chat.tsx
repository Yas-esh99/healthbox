import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Volume2, Bot, Mic, Globe, MicOff, X, Settings, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/lib/language";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Health Assistant" }] }),
  component: ChatPage,
});

type Msg = { id: number; from: "bot" | "user"; text: string; animate?: boolean };

const QUICK_QUESTIONS = [
  "How to use card?",
  "Find medicine",
  "Nearest hospital",
  "Book a camp",
  "Check symptoms",
];

const VOICE_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "mr-IN", label: "मराठी" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "or-IN", label: "ଓଡ଼ିଆ" },
  { code: "ur-PK", label: "اردو" },
  { code: "ar-SA", label: "العربية" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "de-DE", label: "Deutsch" },
  { code: "zh-CN", label: "中文" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "pt-BR", label: "Português" },
];

function cleanText(text: string): string {
  // Remove markdown bold asterisks (**)
  let cleaned = text.replace(/\*\*/g, "");
  // Replace leading * bullet points on a line with •
  cleaned = cleaned.replace(/^\s*\*\s+/gm, "• ");
  // Remove any remaining lone asterisks
  cleaned = cleaned.replace(/\*/g, "");
  return cleaned.trim();
}

// Render bold (**text**) and links ([label](url)) inline
function renderInlineStyles(text: string): React.ReactNode {
  const boldParts = text.split(/\*\*([^*]+)\*\*/g);

  return boldParts.map((part, index) => {
    const isBold = index % 2 === 1;
    const parsedContent = parseLinks(part);

    if (isBold) {
      return (
        <strong key={index} className="font-extrabold text-foreground">
          {parsedContent}
        </strong>
      );
    }
    return <span key={index}>{parsedContent}</span>;
  });
}

function parseLinks(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [_, label, url] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    if (url.startsWith("/")) {
      parts.push(
        <Link
          key={matchIndex}
          to={url as any}
          className="text-primary font-bold underline hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
        >
          {label}
        </Link>,
      );
    } else {
      parts.push(
        <a
          key={matchIndex}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-bold underline hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
        >
          {label}
        </a>,
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

// Premium Markdown / Rich Message Renderer Component
function FormattedChatMessage({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={lineIdx} className="text-base font-black mt-3 text-foreground tracking-tight">
              {renderInlineStyles(trimmed.substring(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={lineIdx} className="text-lg font-black mt-4 text-foreground tracking-tight">
              {renderInlineStyles(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={lineIdx} className="text-xl font-black mt-5 text-foreground tracking-tight">
              {renderInlineStyles(trimmed.substring(2))}
            </h1>
          );
        }

        const isBullet =
          trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ");
        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-primary mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="flex-1">{renderInlineStyles(trimmed.substring(2))}</span>
            </div>
          );
        }

        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        return (
          <p key={lineIdx} className="text-foreground/90">
            {renderInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

let idSeq = 2;

function ChatPage() {
  const { t, currentLanguage } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      from: "bot",
      text: "Namaste! I'm your health assistant. Ask me anything or tap a quick question below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [showMicModal, setShowMicModal] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Smooth scroll to bottom when message length changes or typing indicator is toggled
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isTyping]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    const userMsg: Msg = { id: idSeq++, from: "user", text: value };
    setInput("");

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    setIsTyping(true);
    try {
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.from,
          text: m.text,
        })),
      };

      const res = (await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as { reply: string };

      const replyText = res.reply.trim();
      setMessages((m) => [...m, { id: idSeq++, from: "bot", text: replyText }]);
    } catch (err) {
      toast.error("Failed to connect to Health Assistant");
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const speak = (msg: Msg) => {
    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any currently active speech

    const utterance = new SpeechSynthesisUtterance(msg.text);

    // Set engine language locale based on app selection
    if (currentLanguage === "hi") {
      utterance.lang = "hi-IN";
    } else if (currentLanguage === "gu") {
      utterance.lang = "gu-IN";
    } else if (currentLanguage === "mr") {
      utterance.lang = "mr-IN";
    } else {
      utterance.lang = "en-IN";
    }

    // Attempt to locate a localized voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(utterance.lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
    toast("Speaking response", { description: "Reading the reply aloud" });
  };

  const startListening = async (lang: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported", {
        description: "Your browser doesn't support Web Speech API. Try Chrome or Edge.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Secure context check warning (non-blocking)
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      toast.warning("Insecure Context", {
        description: "Microphone access may be restricted by the browser over non-HTTPS connections. If it fails, please use localhost or HTTPS.",
      });
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;

    rec.onstart = () => {
      setIsListening(true);
      const langLabel = VOICE_LANGUAGES.find((l) => l.code === lang)?.label ?? lang;
      toast.info(`Listening in ${langLabel}…`, { description: "Speak now, then pause" });
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => {
        const space = prev && !prev.endsWith(" ") ? " " : "";
        return prev + space + transcript;
      });
      toast.success("Got it! 🎙️", { description: `"${event.results[0][0].transcript}"` });
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      const code: string = event.error ?? "";
      if (code === "no-speech") {
        toast("No speech detected", { description: "Tap the mic and speak clearly." });
      } else if (code === "not-allowed") {
        setShowMicModal(true);
      } else if (code === "service-not-allowed") {
        const isBrave = (navigator as any).brave !== undefined;
        if (isBrave) {
          toast.error("Brave Shields block detected", {
            description: "Please enable 'Speech Recognition' in brave://settings/shields.",
          });
        } else {
          toast.error("Speech service blocked", {
            description: "Chrome's online speech service is unreachable or blocked.",
          });
        }
      } else if (code === "network") {
        toast.error("Network error", {
          description: "Speech recognition requires an active internet connection.",
        });
      } else if (code === "audio-capture") {
        toast.error("No microphone found", {
          description: "Connect a microphone and try again.",
        });
      } else {
        toast.error(`Voice error: ${code}`, {
          description: "Try again or switch to typing.",
        });
      }
      console.error("Speech recognition error:", event.error, event);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e: any) {
      toast.error("Failed to start speech recognition", {
        description: e.message || "Unknown error",
      });
      console.error("Failed to start speech recognition", e);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening(voiceLang);
    }
  };

  // Sync voiceLang with app language changes
  useEffect(() => {
    if (currentLanguage === "hi") {
      setVoiceLang("hi-IN");
    } else if (currentLanguage === "gu") {
      setVoiceLang("gu-IN");
    } else if (currentLanguage === "mr") {
      setVoiceLang("mr-IN");
    } else {
      setVoiceLang("en-IN");
    }
  }, [currentLanguage]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Close language picker on outside click
  useEffect(() => {
    if (!showLangPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-picker]")) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLangPicker]);

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      {/* Mic Permission Modal */}
      {showMicModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500">
                  <MicOff className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-base font-black text-foreground">Microphone Blocked</h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Permission required for voice input</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Steps */}
            <div className="px-5 pb-2 space-y-3">
              <p className="text-sm text-muted-foreground">Your browser has blocked microphone access. Follow these steps to enable it:</p>
              {[
                { step: "1", text: "Click the 🔒 lock icon in your browser's address bar" },
                { step: "2", text: 'Find "Microphone" and change it to "Allow"' },
                { step: "3", text: "Reload the page and try again" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-black">{step}</span>
                  <p className="text-sm text-foreground font-medium leading-snug pt-0.5">{text}</p>
                </div>
              ))}
            </div>
            {/* Actions */}
            <div className="flex gap-2 p-5 pt-4">
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMicModal(false);
                  // Reload triggers re-prompt on some browsers
                  window.location.reload();
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
              >
                <Settings className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="shrink-0 border-b border-border/80 bg-card/85 backdrop-blur-md z-20 shadow-xs">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-3.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr from-primary/15 to-primary/5 text-primary border border-primary/10 shadow-xs">
            <Bot className="h-6 w-6 animate-pulse" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-base md:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              Health Assistant
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded">
                AI
              </span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-ping"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-secondary absolute"></span>
              Online · Speaks English / Hindi / Gujarati / Marathi
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-64 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {messages.map((m) =>
          m.from === "bot" ? (
            <div key={m.id} className="flex items-end gap-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-primary/15 to-primary/5 text-primary border border-primary/10 shadow-inner">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-border bg-card/75 backdrop-blur-xs px-5 py-3.5 shadow-xs transition-all hover:bg-card/90">
                <div className="text-[15px] leading-relaxed text-foreground">
                  <FormattedChatMessage text={m.text} />
                </div>
                <button
                  type="button"
                  onClick={() => speak(m)}
                  aria-label="Play audio"
                  className={
                    "mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-bold transition-all hover:bg-background shadow-xs hover:border-primary/30 " +
                    (speakingId === m.id
                      ? "text-primary border-primary/30 bg-primary/5 animate-pulse"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  {speakingId === m.id ? "Playing..." : "Listen"}
                </button>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-3xl rounded-br-md bg-gradient-to-tr from-primary to-primary/85 px-5 py-3.5 text-[15px] leading-relaxed text-primary-foreground shadow-sm transition-all hover:shadow-md">
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            </div>
          ),
        )}

        {isTyping && (
          <div className="flex items-end gap-3.5 animate-fade-in">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-primary/15 to-primary/5 text-primary border border-primary/10">
              <Bot className="h-4.5 w-4.5" />
            </span>
            <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-border bg-card px-5 py-3.5 shadow-xs">
              <div className="flex items-center gap-1 py-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-[72px] z-20 border-t border-border bg-card/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto w-full max-w-2xl px-5 py-3.5">
          {/* Quick questions */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="shrink-0 whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/45 transition-all hover:scale-102 hover:shadow-xs active:scale-98"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            {/* Mic + Language Picker */}
            <div className="relative shrink-0 flex items-center gap-1.5" data-lang-picker>
              {/* Language picker popup */}
              {showLangPicker && !isListening && (
                <div className="absolute bottom-14 left-0 z-50 w-44 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Pick language</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {VOICE_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setVoiceLang(lang.code);
                          setShowLangPicker(false);
                          startListening(lang.code);
                        }}
                        className={
                          "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-muted " +
                          (voiceLang === lang.code ? "text-primary font-bold bg-primary/5" : "text-foreground font-medium")
                        }
                      >
                        <span>{lang.label}</span>
                        {voiceLang === lang.code && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mic button (Tapping starts/stops recording immediately) */}
              <button
                type="button"
                onClick={handleMicClick}
                aria-label="Voice input"
                className={
                  "grid h-12 w-12 place-items-center rounded-full border border-border transition-all shadow-xs " +
                  (isListening
                    ? "bg-red-500 border-red-500 text-white animate-pulse shadow-md scale-105"
                    : "bg-background text-primary hover:border-primary/45 active:bg-muted active:scale-95")
                }
              >
                <Mic className="h-5 w-5" />
              </button>

              {/* Language selection pill badge */}
              {!isListening && (
                <button
                  type="button"
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="flex h-12 px-2.5 items-center justify-center rounded-full border border-border bg-background text-[11px] font-black text-muted-foreground hover:border-primary/45 hover:text-primary active:bg-muted transition-all shadow-2xs gap-0.5"
                >
                  <span>{VOICE_LANGUAGES.find((l) => l.code === voiceLang)?.label ?? "English"}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              )}
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="h-12 min-w-0 flex-1 rounded-full border border-border bg-background px-5 text-[15px] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-inner transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-primary to-primary/85 text-primary-foreground shadow-md hover:shadow-lg active:scale-92 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <SosButton />
      <BottomNav />
    </div>
  );
}
