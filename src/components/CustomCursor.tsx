"use client";
import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.18;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.current.x - 16}px, ${pos.current.y - 16}px, 0)`;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => requestRef.current && cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const addGrow = (e: Event) => {
      if (cursorRef.current) cursorRef.current.classList.add("cursor-grow");
    };
    const removeGrow = (e: Event) => {
      if (cursorRef.current) cursorRef.current.classList.remove("cursor-grow");
    };
    const selectors = "button, a, .luxury-card, .ripple-btn";
    document.querySelectorAll(selectors).forEach((el) => {
      el.addEventListener("mouseenter", addGrow);
      el.addEventListener("mouseleave", removeGrow);
    });
    return () => {
      document.querySelectorAll(selectors).forEach((el) => {
        el.removeEventListener("mouseenter", addGrow);
        el.removeEventListener("mouseleave", removeGrow);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
      style={{ width: 32, height: 32 }}
    />
  );
}
