"use client";
import { useRef, useEffect, useState } from "react";

export default function ScrollReveal({
  children,
  className = "",
  threshold = 0.15,
  y = 32,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={
        `${className} transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform` +
        (visible
          ? " opacity-100 translate-y-0"
          : ` opacity-0 translate-y-[${y}px]`)
      }
    >
      {children}
    </div>
  );
}
