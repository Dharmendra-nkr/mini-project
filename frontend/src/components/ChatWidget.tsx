"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, RotateCcw, Volume2, Mic, MicOff, Calendar, Eye, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { chat, voice, ChatResponse } from "../lib/api";
import { chatStore, SelectedRoom } from "../lib/chatStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

// Web Speech API types
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [bookingStep, setBookingStep] = useState<"dates" | "search" | "room" | "guest-details" | "confirm" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Subscribe to store changes
  useEffect(() => {
    return chatStore.subscribe(() => {
      const state = chatStore.getState();
      if (state.selectedRoom) {
        setSelectedRoom(state.selectedRoom);
        // Show "Proceed with selected room" message
        if (state.checkIn && state.checkOut) {
          const roomMsg = `Selected: ${state.selectedRoom.room_name} (${state.selectedRoom.wing}) - $${state.selectedRoom.base_price}/night`;
          setMessages((prev) => [
            ...prev,
            { role: "user", content: `I want to book ${roomMsg}` },
          ]);
          setBookingStep("guest-details");
        }
      }
    });
  }, []);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Greeting on first open
  const greetedRef = useRef(false);
  useEffect(() => {
    if (open && !greetedRef.current && messages.length === 0) {
      greetedRef.current = true;
      chat
        .greeting()
        .then((res) => {
          setSessionId(res.session_id);
          setMessages([
            { role: "assistant", content: res.message, quickReplies: res.quick_replies },
          ]);
        })
        .catch(() => {
          setMessages([
            { role: "assistant", content: "Welcome to Grand Meridian Resort! How can I help you today?" },
          ]);
        });
    }
  }, [open, messages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      // Handle special quick replies
      if (text === "3D Viewer" || text.includes("3D")) {
        router.push("/explore");
        return;
      }

      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res: ChatResponse = await chat.send(text.trim(), sessionId);
        setSessionId(res.session_id);

        // Parse quick replies to detect special actions
        let quickReplies = res.quick_replies || [];
        if (
          text.toLowerCase().includes("available") ||
          text.toLowerCase().includes("search")
        ) {
          quickReplies = [...quickReplies, "3D Viewer"];
          setBookingStep("dates");
        }

        // Add 3D Viewer to hotel info replies
        if (
          text.toLowerCase().includes("resort") ||
          text.toLowerCase().includes("info")
        ) {
          quickReplies = [...quickReplies, "3D Viewer"];
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.message, quickReplies },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      }
      setLoading(false);
    },
    [loading, sessionId, router]
  );

  const submitDatePicker = useCallback(() => {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      alert("Please select valid dates (checkout after checkin)");
      return;
    }
    chatStore.setDates(checkIn, checkOut);
    setShowDatePicker(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Check-in: ${checkIn}, Check-out: ${checkOut}` },
    ]);
    // Trigger search
    sendMessage(`Check-in: ${checkIn}, Check-out: ${checkOut}`);
  }, [checkIn, checkOut, sendMessage]);

  const resetChat = async () => {
    await chat.reset(sessionId).catch(() => {});
    setMessages([]);
    setSessionId(undefined);
    greetedRef.current = false;
  };

  const speakText = async (text: string) => {
    try {
      const blob = await voice.ttsUrl(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      // TTS not available — silent fail
    }
  };

  // ── Voice Input (STT via Web Speech API) ──
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new (SpeechRecognition as new () => SpeechRecognitionInstance)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        sendMessage(transcript.trim());
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, sendMessage]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--gold)] text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform pulse-gold"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-black/10 animate-slide-up bg-white">
          {/* Header */}
          <div className="bg-resort-hero px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-white font-bold text-sm">AI Concierge</h3>
              <p className="text-white/70 text-xs">Grand Meridian Resort</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                className="text-white/70 hover:text-white transition"
                title="New conversation"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--sand)]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm animate-slide-up ${
                    msg.role === "user"
                      ? "bg-[var(--navy)] text-white rounded-br-md"
                      : "bg-white text-[var(--foreground)] shadow-sm rounded-bl-md border border-black/5"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="chat-markdown">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {/* TTS button */}
                      <button
                        onClick={() => speakText(msg.content)}
                        className="mt-1 text-[var(--muted)] hover:text-[var(--ocean)] transition"
                        title="Listen"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Date Picker Widget */}
            {showDatePicker && (
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 space-y-2">
                <label className="text-xs font-bold text-[var(--navy)] flex items-center gap-1">
                  <Calendar size={14} /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-[var(--gold)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
                  min={new Date().toISOString().split("T")[0]}
                />

                <label className="text-xs font-bold text-[var(--navy)] flex items-center gap-1">
                  <Calendar size={14} /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-[var(--gold)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30"
                  min={checkIn || new Date().toISOString().split("T")[0]}
                />

                <button
                  onClick={submitDatePicker}
                  className="w-full bg-[var(--gold)] text-white text-xs font-bold py-2 rounded-lg hover:bg-[var(--gold-light)] transition flex items-center justify-center gap-1"
                >
                  <Check size={14} /> OK, Search Rooms
                </button>
              </div>
            )}

            {/* Quick replies */}
            {messages.length > 0 &&
              messages[messages.length - 1].quickReplies?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {messages[messages.length - 1].quickReplies!.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => {
                      if (qr === "Search rooms" || qr.includes("Search")) {
                        setShowDatePicker(true);
                      } else {
                        sendMessage(qr);
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      qr === "3D Viewer"
                        ? "bg-[var(--navy)] text-white border border-[var(--navy)]"
                        : "border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white"
                    }`}
                  >
                    {qr === "3D Viewer" && <Eye size={12} className="inline mr-1" />}
                    {qr}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-black/5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="shrink-0 px-3 py-3 bg-white border-t border-black/5 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about the resort..."
              className="flex-1 text-sm px-3 py-2 rounded-full bg-[var(--sand)] border border-transparent focus:border-[var(--gold)] focus:outline-none transition"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-[var(--sand)] text-[var(--muted)] hover:text-[var(--navy)]"
              }`}
              title={listening ? "Stop listening" : "Voice input"}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[var(--gold)] text-white flex items-center justify-center hover:bg-[var(--gold-light)] hover:text-[var(--navy)] disabled:opacity-40 transition"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
