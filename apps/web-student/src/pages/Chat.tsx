import { FormEvent, useEffect, useRef, useState } from "react";

import { SmartButton } from "@smartfaq/ui";

import { useI18n, availableLanguages } from "../lib/i18n";
import { useChat } from "../hooks/useChat";
import { cn } from "@/lib/utils";

const quickPrompts = [
  "Admission requirements",
  "Tuition fees",
  "Academic calendar",
  "Student services",
];

const MAX_MESSAGE_LENGTH = 500;

const ChatPage = () => {
  const { t, lang, setLang } = useI18n();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const { history, sendMessage, isLoading } = useChat();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || input.length > MAX_MESSAGE_LENGTH) return;
    setTyping(true);
    await sendMessage(input.trim());
    setInput("");
    setTyping(false);
  };

  const remaining = MAX_MESSAGE_LENGTH - input.length;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-indigo-50 px-6 pb-8">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-4 pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">
            Greenwich SmartFAQ
          </h1>
          <p className="mt-1 text-base text-slate-600">{t("prompt")}</p>
        </div>
        <select
          value={lang}
          onChange={(event) =>
            setLang(event.target.value as (typeof availableLanguages)[number])
          }
          className="max-w-[160px] rounded-lg border border-indigo-200 bg-white px-2 py-2"
        >
          {availableLanguages.map((value) => (
            <option key={value} value={value}>
              {value.toUpperCase()}
            </option>
          ))}
        </select>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
        <section className="shadow-slate-900/8 rounded-2xl bg-white p-6 shadow-lg">
          <p className="text-slate-600">{t("welcome")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {quickPrompts.map((prompt) => (
              <SmartButton
                key={prompt}
                emphasis="secondary"
                onClick={() => setInput(prompt)}
                type="button"
              >
                {prompt}
              </SmartButton>
            ))}
          </div>
        </section>

        <section
          ref={listRef}
          className="shadow-slate-900/8 relative flex max-h-[520px] min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        >
          {history.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.author === "user" ? "items-end" : "items-start"
              )}
            >
              <span
                className={cn(
                  "shadow-slate-900/12 max-w-[75%] rounded-2xl px-4 py-3 text-base shadow-md",
                  message.author === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-900"
                )}
              >
                {message.content}
              </span>
              <p className="text-xs text-slate-400">{message.timestamp}</p>
            </div>
          ))}
          {isLoading && (
            <p className="text-sm text-primary-600">Assistant is typing…</p>
          )}
          {typing && (
            <p className="text-sm text-primary-600">{t("feedback")}</p>
          )}
        </section>

        <form
          onSubmit={handleSubmit}
          className="shadow-slate-900/8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={3}
            placeholder={t("prompt")}
            className="min-h-[110px] w-full resize-y rounded-xl border border-indigo-200 px-4 py-4 text-base font-normal focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{remaining} characters remaining</span>
            <SmartButton type="submit" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send"}
            </SmartButton>
          </div>
        </form>

        <section className="shadow-slate-900/8 rounded-2xl bg-white p-6 shadow-lg">
          <p className="mb-3 text-slate-600">{t("feedback")}</p>
          <div className="flex flex-wrap gap-3">
            <SmartButton emphasis="secondary" type="button">
              👍
            </SmartButton>
            <SmartButton emphasis="secondary" type="button">
              👎
            </SmartButton>
            <SmartButton type="button">{t("getHelp")}</SmartButton>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChatPage;
