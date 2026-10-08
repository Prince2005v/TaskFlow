"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, X, MessageSquare, Bot } from "lucide-react";
import type { AIChatResponse } from "@/lib/ai-schemas";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  dataPoints?: string[];
  timestamp: Date;
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What tasks are overdue?",
  "Who has the most tasks?",
  "What should we prioritize today?",
  "Summarize this week's progress.",
];

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm TaskFlow AI. I can answer questions about your workspace — tasks, team workload, priorities, and progress. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed to respond");

      const aiResponse: AIChatResponse = data.response;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.answer,
        dataPoints: aiResponse.dataPoints,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I encountered an issue processing your request. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        type="button"
        id="ai-chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-2xl shadow-xl transition-all duration-200 ${
          isOpen
            ? "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            : "bg-violet-600 text-white hover:bg-violet-500 shadow-violet-900/30"
        }`}
        style={{ height: "52px", width: "52px" }}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">TaskFlow AI</div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Workspace-aware assistant
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px] min-h-[250px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : message.isError
                      ? "bg-rose-500/10 border border-rose-500/20"
                      : "bg-violet-500/10 border border-violet-500/20"
                  }`}
                >
                  {message.role === "user" ? (
                    <span className="text-[10px] font-bold">You</span>
                  ) : (
                    <Sparkles
                      className={`h-3.5 w-3.5 ${
                        message.isError ? "text-rose-400" : "text-violet-400"
                      }`}
                    />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[260px] space-y-1.5 ${
                    message.role === "user" ? "items-end" : "items-start"
                  } flex flex-col`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : message.isError
                        ? "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-bl-sm"
                        : "bg-zinc-800/80 text-zinc-200 rounded-bl-sm"
                    }`}
                  >
                    {message.content}
                  </div>

                  {/* Data points */}
                  {message.dataPoints && message.dataPoints.length > 0 && (
                    <div className="space-y-1">
                      {message.dataPoints.map((dp, i) => (
                        <div
                          key={i}
                          className="text-[10px] text-zinc-500 flex items-center gap-1"
                        >
                          <div className="h-1 w-1 rounded-full bg-violet-500 shrink-0" />
                          {dp}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-600">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-zinc-800/80 px-3.5 py-2.5 flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && !isLoading && (
            <div className="border-t border-zinc-800/40 px-3 pt-2 pb-1">
              <p className="text-[10px] text-zinc-600 mb-1.5">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-violet-500/30 hover:text-violet-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-zinc-800/60 p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                id="ai-chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your workspace..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
                style={{ maxHeight: "80px" }}
              />
              <button
                type="button"
                id="ai-chat-send-btn"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-zinc-600 text-center">
              Only sees your authorized workspace data
            </p>
          </div>
        </div>
      )}
    </>
  );
}
