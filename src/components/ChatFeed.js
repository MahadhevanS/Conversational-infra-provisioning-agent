import React, { useEffect, useRef } from "react";

const ChatFeed = ({
  messages,
  isTyping,
  botStatus,
  chatStarted,
  onOptionClick,
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, botStatus]);

  if (!chatStarted) return null;

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 pb-36">
      <div className="flex flex-col gap-5">
        {messages.map((msg, idx) => (
          <div key={idx} className="w-full flex justify-center">
            <div className="w-full max-w-[760px] px-4 flex gap-3">
              {/* BOT AVATAR */}
              {msg.role === "bot" && (
                <div
                  className="
                    w-8 h-8 shrink-0 flex items-center justify-center
                    rounded-md text-xs font-medium
                    bg-zinc-200 dark:bg-white/10
                    text-zinc-600 dark:text-zinc-400
                  "
                >
                  CC
                </div>
              )}

              {/* MESSAGE COLUMN */}
              <div
                className={`flex flex-col w-full ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* 🔹 STEP TOPIC (BOT ONLY) */}
                {msg.role === "bot" && msg.topic && (
                  <div
                    className="
                      mb-1 ml-1 text-[11px] tracking-wide uppercase
                      text-zinc-400 dark:text-zinc-500
                    "
                  >
                    {msg.topic}
                  </div>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`
                    px-5 py-3 text-sm leading-relaxed
                    w-fit max-w-[70%]
                    whitespace-pre-wrap break-words
                    transition-colors
                    ${
                      msg.role === "user"
                        ? `
                          bg-indigo-600
                          text-white
                          shadow-md
                          rounded-2xl rounded-br-none
                          ml-auto
                        `
                        : `
                          bg-zinc-100 text-zinc-900
                          dark:bg-zinc-800 dark:text-zinc-100
                          border border-zinc-200 dark:border-white/10
                          shadow-sm
                          rounded-2xl rounded-tl-none
                        `
                    }
                  `}
                >
                  {msg.text}
                </div>

                {/* OPTION BUTTONS */}
                {msg.buttons && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[70%]">
                    {msg.buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => onOptionClick(btn.value)}
                        className="
                          px-3 py-1.5 text-xs rounded-full
                          border border-indigo-500/40
                          text-indigo-600 dark:text-indigo-400
                          hover:bg-indigo-500/10
                          transition
                        "
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[760px] px-4 flex gap-3">
              <div
                className="
                  w-8 h-8 shrink-0 flex items-center justify-center
                  rounded-md text-xs
                  bg-zinc-200 dark:bg-white/10
                  text-zinc-500 dark:text-zinc-400
                "
              >
                CC
              </div>

              <div
                className="
                  px-4 py-2 text-sm italic
                  bg-zinc-100 text-zinc-600
                  dark:bg-zinc-800 dark:text-zinc-400
                  border border-zinc-200 dark:border-white/10
                  rounded-2xl rounded-tl-none
                "
              >
                {botStatus || "CloudCrafter is thinking"}…
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatFeed;
