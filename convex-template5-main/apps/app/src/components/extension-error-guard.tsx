"use client";

import { useEffect } from "react";

export function ExtensionErrorGuard() {
  useEffect(() => {
    function isExt(e: unknown): boolean {
      const err = e as
        | { message?: string; stack?: string; filename?: string }
        | undefined;
      const s = `${(err && (err.message || err.stack || err.filename)) || ""}`;
      return (
        s.indexOf("MetaMask") !== -1 ||
        s.indexOf("chrome-extension://") !== -1 ||
        s.indexOf("moz-extension://") !== -1
      );
    }
    const onUnhandled = (ev: PromiseRejectionEvent) => {
      if (ev && isExt(ev.reason)) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    const onError = (ev: ErrorEvent) => {
      if (ev && (isExt(ev.error) || isExt(ev))) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    window.addEventListener("unhandledrejection", onUnhandled, true);
    window.addEventListener("error", onError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandled, true);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: inline immediate execution before hydration
      dangerouslySetInnerHTML={{
        __html: `(function(){if(typeof window==='undefined')return;function isExt(e){var s=((e&&(e.message||e.stack||e.filename))||'')+'';return s.indexOf('MetaMask')!==-1||s.indexOf('chrome-extension://')!==-1||s.indexOf('moz-extension://')!==-1;}window.addEventListener('unhandledrejection',function(ev){if(ev&&isExt(ev.reason)){ev.preventDefault();ev.stopImmediatePropagation();}},true);window.addEventListener('error',function(ev){if(ev&&(isExt(ev.error)||isExt(ev))){ev.preventDefault();ev.stopImmediatePropagation();}},true);})();`,
      }}
    />
  );
}
