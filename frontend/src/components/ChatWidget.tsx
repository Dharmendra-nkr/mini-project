"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, RotateCcw, Volume2, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chat, voice, ChatResponse } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  type?: "text" | "date-picker" | "wing-picker" | "room-selected";
  data?: any;
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
  const [dateRange, setDateRange] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Listen for room selection from 3D explorer
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("selected_room");
      if (stored) {
        const room = JSON.parse(stored);
        if (!selectedRoom || selectedRoom.id !== room.id) {
          setSelectedRoom(room);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `You selected room ${room.roomName} in ${room.wing}. Ready to proceed?`,
              type: "room-selected",
              data: room,
            },
          ]);
        }
        localStorage.removeItem("selected_room");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

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

  // Enhanced sendMessage to handle booking flow
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      // Booking flow trigger
      if (/\b(availability|available rooms|check availability|book room|show rooms)\b/i.test(text)) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please select your check-in and check-out dates:",
            type: "date-picker",
          },
        ]);
        setLoading(false);
        return;
      }
      // Fallback to normal chat
      try {
        const res: ChatResponse = await chat.send(text.trim(), sessionId);
        setSessionId(res.session_id);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.message, quickReplies: res.quick_replies },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      }
      setLoading(false);
    },
    [loading, sessionId]
  );

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
                  {/* Custom message types */}
                  {msg.type === "date-picker" ? (
                    <DatePickerMessage
                      onSelect={(checkIn, checkOut) => {
                        setDateRange({ checkIn, checkOut });
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            content: "Which wing do you prefer?",
                            type: "wing-picker",
                          },
                        ]);
                      }}
                    />
                  ) : msg.type === "wing-picker" ? (
                    <WingPickerMessage
                      onSelect={(wing) => {
                        setSelectedWing(wing);
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            content: `You selected ${wing}. You can also explore in 3D!`,
                            type: "room-selected",
                            data: { wing },
                          },
                        ]);
                      }}
                      on3D={() => {
                        // Save state for 3D explorer
                        if (dateRange) {
                          localStorage.setItem("booking_dates", JSON.stringify(dateRange));
                        }
                        if (selectedWing) {
                          localStorage.setItem("booking_wing", selectedWing);
                        }
                        router.push("/explore");
                      }}
                    />
                  ) : msg.type === "room-selected" ? (
                    <RoomSelectedMessage
                      data={msg.data}
                      onProceed={() => {
                        // Proceed to booking details
                        setMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            content: "Please provide your details to confirm the booking.",
                          },
                        ]);
                      }}
                    />
                  ) : msg.role === "assistant" ? (
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

            {/* Quick replies */}
            {messages.length > 0 &&
              messages[messages.length - 1].quickReplies?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {messages[messages.length - 1].quickReplies!.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white transition"
                  >
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

// Date picker for check-in/check-out
function DatePickerMessage({ onSelect }: { onSelect: (checkIn: string, checkOut: string) => void }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-[var(--muted)]">Check-in:</label>
        <input
          type="date"
          min={today}
          value={checkIn}
          onChange={e => setCheckIn(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-[var(--gold)]"
        />
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-[var(--muted)]">Check-out:</label>
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={e => setCheckOut(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-[var(--gold)]"
        />
      </div>
      <button
        className="mt-2 rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gold-light)] disabled:opacity-40"
        disabled={!checkIn || !checkOut || checkOut <= checkIn}
        onClick={() => onSelect(checkIn, checkOut)}
      >
        OK
      </button>
    </div>
  );
}

// Wing picker with 3D viewer button
function WingPickerMessage({ onSelect, on3D }: { onSelect: (wing: string) => void; on3D: () => void }) {
  const wings = ["Coral Wing", "Palm Wing", "Horizon Wing", "Reef Wing"];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {wings.map(wing => (
          <button
            key={wing}
            onClick={() => onSelect(wing)}
            className="text-xs px-3 py-1.5 rounded-full border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white transition"
          >
            {wing}
          </button>
        ))}
      </div>
      <button
        onClick={on3D}
        className="mt-2 rounded-full bg-[var(--navy)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gold)] hover:text-[var(--navy)] transition"
      >
        3D Viewer
      </button>
    </div>
  );
}

// Room selected summary and proceed button
function RoomSelectedMessage({ data, onProceed }: { data: any; onProceed: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-[var(--navy)] font-semibold">Room selected: {data?.roomName || data?.wing || "(from 3D)"}</div>
      <button
        onClick={onProceed}
        className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gold-light)]"
      >
        Proceed with booking
      </button>
    </div>
  );
}


