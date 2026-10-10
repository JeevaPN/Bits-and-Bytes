"use client";

import { useEffect, useState } from "react";

type PageTarget = { element: HTMLElement; label: string; top: number };

function getDocumentTop(element: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
}

export function WorkspacePageNavigation() {
  const [pages, setPages] = useState<PageTarget[]>([]);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const deck = document.querySelector<HTMLElement>(".workspace-scroll-deck");
    if (!deck) return;

    let frame = 0;
    let currentPages: PageTarget[] = [];
    const updatePages = () => {
      const panels = Array.from(deck.querySelectorAll<HTMLElement>(":scope > .workspace-deck-panel"));
      const nextPages = panels.map((element, index) => {
        return {
          element,
          label: element.getAttribute("aria-label") || `Page ${index + 1}`,
          top: getDocumentTop(element),
        };
      });
      currentPages = nextPages;
      setPages(nextPages);
      updateActivePage();
    };

    const updateActivePage = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let closestIndex = 0;
        const headerHeight = document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect().height ?? 0;
        const marker = window.scrollY + headerHeight + 1;
        currentPages.forEach((page, index) => {
          if (page.top <= marker) closestIndex = index;
        });
        currentPages.forEach((page, index) => {
          page.element.style.zIndex = index <= closestIndex ? String(index + 1) : "0";
        });
        setActivePage(closestIndex);
      });
    };

    const observer = new MutationObserver(updatePages);
    observer.observe(deck, { childList: true });
    updatePages();
    const onScroll = () => updateActivePage();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updatePages);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updatePages);
    };
  }, []);

  if (pages.length < 2) return null;

  return (
    <nav className="workspace-page-dots" aria-label="Scroll pages">
      {pages.map(({ element, label }, index) => (
        <button
          aria-label={`Go to ${label}`}
          aria-current={activePage === index ? "step" : undefined}
          className={activePage === index ? "workspace-page-dot is-active" : "workspace-page-dot"}
          key={`${label}-${index}`}
          onClick={() => {
            const headerHeight = document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect().height ?? 0;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const targetTop = Math.min(maxScroll, Math.max(0, getDocumentTop(element) - headerHeight));
            window.scrollTo({ top: targetTop, behavior: "smooth" });
          }}
          title={label}
          type="button"
        >
          <span />
        </button>
      ))}
    </nav>
  );
}
