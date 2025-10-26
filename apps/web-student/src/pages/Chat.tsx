import { FormEvent, useEffect, useRef, useState } from "react";

import { SmartButton } from "@smartfaq/ui";

import { useI18n, availableLanguages } from "../lib/i18n";
import { useChat } from "../hooks/useChat";

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
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header__title">
          <h1>Greenwich SmartFAQ</h1>
          <p>{t("prompt")}</p>
        </div>
        <select
          value={lang}
          onChange={(event) =>
            setLang(event.target.value as (typeof availableLanguages)[number])
          }
        >
          {availableLanguages.map((value) => (
            <option key={value} value={value}>
              {value.toUpperCase()}
            </option>
          ))}
        </select>
      </header>

      <main className="chat-main">
        <section className="chat-welcome">
          <p>{t("welcome")}</p>
          <div className="chat-welcome__quick-actions">
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

        <section ref={listRef} className="chat-history">
          {history.map((message) => (
            <div
              key={message.id}
              className={`chat-message chat-message--${message.author}`}
            >
              <span className="chat-message__bubble">{message.content}</span>
              <p className="chat-message__timestamp">{message.timestamp}</p>
            </div>
          ))}
          {isLoading && <p className="chat-meta">Assistant is typing…</p>}
          {typing && <p className="chat-meta">{t("feedback")}</p>}
        </section>

        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={3}
            placeholder={t("prompt")}
          />
          <div className="chat-form__footer">
            <span>{remaining} characters remaining</span>
            <SmartButton type="submit" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send"}
            </SmartButton>
          </div>
        </form>

        <section className="chat-feedback">
          <p>{t("feedback")}</p>
          <div className="chat-feedback__actions">
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
