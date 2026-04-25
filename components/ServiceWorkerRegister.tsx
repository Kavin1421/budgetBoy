"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();
    }).catch(() => {
      // intentionally silent to avoid noisy console in unsupported contexts
    });
  }, []);

  return null;
}
