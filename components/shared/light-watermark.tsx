"use client";

import { useEffect, useRef } from "react";

const RETURN_DURATION_MS = 1_000;

export function LightWatermark() {
  const watermarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const watermark = watermarkRef.current;
    if (!watermark) return;

    let pointerOnCard = false;
    let returnAnimations: Animation[] = [];
    let runId = 0;

    const cardFor = (target: EventTarget | null) =>
      target instanceof Element ? target.closest(".card") : null;

    const traceToStart = () => {
      if (document.documentElement.classList.contains("dark")) return;
      if (watermark.classList.contains("is-returning") || watermark.classList.contains("is-aligned")) return;

      const pieces = Array.from(
        watermark.querySelectorAll<HTMLElement>(".watermark-letter, .light-watermark-star"),
      );
      const currentPositions = pieces.map((piece) => {
        const rect = piece.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      });

      // Stop the CSS drift synchronously, then measure each piece's true home position.
      // The browser paints after this task, so the intermediate reset is not visible.
      watermark.classList.remove("is-scattered");
      watermark.classList.add("is-returning");
      returnAnimations = pieces.map((piece, index) => {
        const home = piece.getBoundingClientRect();
        const offsetX = currentPositions[index].left - home.left;
        const offsetY = currentPositions[index].top - home.top;
        const keyframes: Keyframe[] = [
          { transform: `translate(${offsetX}px, ${offsetY}px)` },
          { transform: "translate(0px, 0px)" },
        ];

        return piece.animate(keyframes, {
          duration: RETURN_DURATION_MS,
          easing: "linear",
          fill: "forwards",
        });
      });

      const currentRun = ++runId;

      void Promise.all(returnAnimations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
        if (currentRun !== runId) return;
        returnAnimations.forEach((animation) => animation.cancel());
        returnAnimations = [];
        watermark.classList.remove("is-returning");
        if (pointerOnCard) watermark.classList.add("is-aligned");
        else watermark.classList.add("is-scattered");
      });
    };

    const handlePointerOver = (event: PointerEvent) => {
      const nextCard = cardFor(event.target);
      const previousCard = cardFor(event.relatedTarget);
      if (!nextCard || nextCard === previousCard) return;

      pointerOnCard = true;
      if (watermark.classList.contains("is-returning")) return;
      if (watermark.classList.contains("is-aligned")) return;
      traceToStart();
    };

    const handlePointerOut = (event: PointerEvent) => {
      const previousCard = cardFor(event.target);
      const nextCard = cardFor(event.relatedTarget);
      if (!previousCard || previousCard === nextCard) return;

      pointerOnCard = false;
      if (watermark.classList.contains("is-aligned")) {
        watermark.classList.remove("is-aligned");
        watermark.classList.add("is-scattered");
      }
    };

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);

    return () => {
      runId += 1;
      returnAnimations.forEach((animation) => animation.cancel());
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return (
    <div ref={watermarkRef} className="light-watermark is-scattered" aria-hidden="true">
      <span className="light-watermark-word light-watermark-civic">
        <span className="watermark-letter watermark-letter-1">C</span>
        <span className="watermark-letter watermark-letter-2">i</span>
        <span className="watermark-letter watermark-letter-3">v</span>
        <span className="watermark-letter watermark-letter-4">i</span>
        <span className="watermark-letter watermark-letter-5">c</span>
      </span>
      <span className="watermark-star light-watermark-star" />
      <span className="light-watermark-word light-watermark-sync">
        <span className="watermark-letter watermark-letter-6">S</span>
        <span className="watermark-letter watermark-letter-7">y</span>
        <span className="watermark-letter watermark-letter-8">n</span>
        <span className="watermark-letter watermark-letter-9">c</span>
      </span>
    </div>
  );
}
