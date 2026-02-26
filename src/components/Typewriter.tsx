"use client";
import { useEffect, useState } from "react";

export default function Typewriter({
  text,
  speed = 38,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (typeof text !== "string" || !text) return;
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  if (typeof text !== "string" || !text) return null;
  return <span className={className}>{displayed}</span>;
}
