import React, { useState, useRef, useEffect } from "react";

const CommandInput = ({ onSend, isTyping, chatStarted, theme, closeSidebar }) => {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // ✅ Auto-grow textarea (max 120px)
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [text]);

  const handleChange = (e) => {
    if (closeSidebar) closeSidebar();
    setText(e.target.value);
  };

  const handleSubmit = () => {
    if (isTyping) return;

    // ✅ Preserve newlines, remove trailing spaces only
    const cleanText = text.replace(/\s+$/, "");
    if (!cleanText) return;
    if (closeSidebar) closeSidebar();
    onSend(cleanText);
    setText("");
  };

  const handleKeyDown = (e) => {
    // Enter → Send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift + Enter → New line (default behavior)
  };

  return (
    <div
      className={`fixed z-40 px-4 transition-all duration-500 ease-out
        ${
          chatStarted
            ? theme === "dark"
              ? "bottom-0 left-0 w-full pb-8 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center"
              : "bottom-0 left-0 w-full pb-8 pt-12 bg-gradient-to-t from-white via-white/80 to-transparent flex justify-center"
            : "top-[55%] left-1/2 -translate-x-1/2 w-full max-w-[700px]"
        }`}
    >
      {/* INPUT SHELL */}
      <div
        className={`
          w-full max-w-[900px] mx-auto flex items-end gap-3 p-3 rounded-2xl
          backdrop-blur-xl shadow-2xl border
          ${
            theme === "dark"
              ? "bg-zinc-900/90 border-white/10"
              : "bg-white/90 border-zinc-200"
          }
        `}
      >
        {/* TEXTAREA */}
        <textarea
  ref={textareaRef}
  rows={1}
  value={text}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  placeholder={
    chatStarted
      ? "Ask CloudCrafter…"
      : "Describe infrastructure (e.g. Launch t3.micro)…"
  }
  autoFocus
  className={`
    flex-1 bg-transparent text-base resize-none outline-none
    max-h-[120px] overflow-y-hidden py-2 min-w-0
    whitespace-pre-wrap break-words
    ${
      theme === "dark"
        ? "text-white placeholder:text-zinc-500"
        : "text-zinc-900 placeholder:text-zinc-400"
    }
  `}
/>


        {/* SEND BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isTyping}
          className={`
            w-11 h-11 flex items-center justify-center rounded-xl
            text-white transition-colors shrink-0
            ${
              theme === "dark"
                ? "bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300"
            }
            disabled:cursor-not-allowed
          `}
        >
          ➤
        </button>
      </div>

      {/* SUGGESTION CHIPS (before chat starts) */}
      {!chatStarted && (
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {[
            "Launch EC2 Instance",
            "Estimate Cost",
            "Create S3 Bucket",
          ].map((item) => (
            <button
              key={item}
              onClick={() => onSend(item)}
              className={`
                px-4 py-2 rounded-full border text-sm transition-all backdrop-blur-sm
                ${
                  theme === "dark"
                    ? "border-white/10 bg-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10"
                    : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-100"
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandInput;
