"use client";

import { useEffect } from "react";

/** Garde les boutons fixes dans la zone visible quand la barre du navigateur mobile se replie. */
export default function VisualViewportPin() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    const sync = () => {
      const viewport = window.visualViewport;
      const inset = viewport
        ? Math.min(96, Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height))
        : 0;
      root.style.setProperty("--vv-bottom", `${Math.round(inset)}px`);
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--vv-bottom");
    };
  }, []);

  return null;
}
