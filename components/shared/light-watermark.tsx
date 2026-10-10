"use client";

import { useEffect, useRef } from "react";
import { ScatteredLightWatermark } from "@/components/shared/scattered-light-watermark";

function FixedDarkWatermark() {
  const watermarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const watermark = watermarkRef.current;
    if (!watermark) return;
    // Detect hovering without placing a clickable layer over page content.
    const targets = Array.from(watermark.querySelectorAll<HTMLElement>(".fixed-brand-word, .fixed-brand-star"));
    const updateHover = (event: PointerEvent) => {
      if (!document.documentElement.classList.contains("dark")) {
        watermark.classList.remove("is-expanded");
        return;
      }
      const hovered = targets.some((target) => {
        const rect = target.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      watermark.classList.toggle("is-expanded", hovered);
    };
    const clearHover = () => watermark.classList.remove("is-expanded");
    document.addEventListener("pointermove", updateHover, { passive: true });
    document.documentElement.addEventListener("pointerleave", clearHover);
    window.addEventListener("blur", clearHover);
    return () => {
      document.removeEventListener("pointermove", updateHover);
      document.documentElement.removeEventListener("pointerleave", clearHover);
      window.removeEventListener("blur", clearHover);
    };
  }, []);

  return (
    <div ref={watermarkRef} className="light-watermark fixed-brand-watermark" aria-hidden="true">
      <span className="fixed-brand-word fixed-brand-civic">
        <span className="fixed-brand-initial">C</span>
        <span className="fixed-brand-suffix">ivic</span>
      </span>
      <span className="fixed-brand-star" />
      <span className="fixed-brand-word fixed-brand-sync">
        <span className="fixed-brand-initial">S</span>
        <span className="fixed-brand-suffix">ync</span>
      </span>
    </div>
  );
}

export function LightWatermark() {
  return <><FixedDarkWatermark /><ScatteredLightWatermark /></>;
}
