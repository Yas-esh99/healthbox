import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Volume2, Bot, Mic } from "lucide-react";
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
        </Link>
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
        </a>
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

        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ");
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

      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }) as { reply: string };

      const replyText = res.reply.trim();
      setMessages((m) => [
        ...m,
        { id: idSeq++, from: "bot", text: replyText },
      ]);
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
    const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
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

  const toggleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    if (currentLanguage === "hi") {
      rec.lang = "hi-IN";
    } else if (currentLanguage === "gu") {
      rec.lang = "gu-IN";
    } else if (currentLanguage === "mr") {
      rec.lang = "mr-IN";
    } else {
      rec.lang = "en-IN";
    }

    rec.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now");
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => {
        const space = prev && !prev.endsWith(" ") ? " " : "";
        return prev + space + transcript;
      });
      toast.success("Voice input added!");
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setIsListening(false);
      toast.error("Could not capture speech.");
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
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
        className="mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-56 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    (speakingId === m.id ? "text-primary border-primary/30 bg-primary/5 animate-pulse" : "text-muted-foreground hover:text-foreground")
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
      <div className="fixed inset-x-0 bottom-[64px] z-20 border-t border-border bg-card/85 backdrop-blur-md shadow-xs">
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
            <button
              type="button"
              onClick={toggleSpeechInput}
              aria-label="Voice input"
              className={
                "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border transition-all shadow-xs " +
                (isListening 
                  ? "bg-red-500 border-red-500 text-white animate-pulse shadow-md scale-108" 
                  : "bg-background text-primary hover:border-primary/45 active:bg-muted active:scale-95")
              }
            >
              <Mic className="h-5 w-5" />
            </button>
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
