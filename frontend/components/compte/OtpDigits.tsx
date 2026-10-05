"use client";

import { ClipboardEvent, useRef } from "react";

type Props = {
  digits: string[];
  onChange: (next: string[]) => void;
};

/** Six cases : saisie chiffre par chiffre, ou collage du code entier. */
export default function OtpDigits({ digits, onChange }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function fill(start: number, raw: string) {
    const chars = raw.replace(/\D/g, "").slice(0, 6);
    if (chars.length > 1) {
      const from = chars.length >= 6 ? 0 : start;
      const slice = chars.slice(0, 6 - from);
      const next = chars.length >= 6 ? ["", "", "", "", "", ""] : [...digits];
      for (let i = 0; i < slice.length; i += 1) next[from + i] = slice[i];
      onChange(next);
      const focusAt = Math.min(from + slice.length, 5);
      inputs.current[focusAt]?.focus();
      return;
    }
    const next = [...digits];
    next[start] = chars;
    onChange(next);
    if (chars && start < 5) inputs.current[start + 1]?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text");
    if (text.replace(/\D/g, "").length < 2) return;
    event.preventDefault();
    const active = inputs.current.findIndex((el) => el === document.activeElement);
    fill(active < 0 ? 0 : active, text);
  }

  return (
    <div className="flex justify-between gap-2" onPaste={onPaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => fill(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[index] && index > 0) {
              inputs.current[index - 1]?.focus();
            }
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Chiffre ${index + 1} du code`}
          maxLength={index === 0 ? 6 : 1}
          className="h-12 w-10 rounded-xl border border-brand-black/15 text-center text-lg font-bold outline-none focus:border-brand-orange sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
