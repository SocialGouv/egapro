"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { type Any } from "@common/utils/types";
import { useEffect, useState } from "react";

declare global {
  export interface Window {
    _disableEgaproDebug(): void;
    _enableEgaproDebug(): void;
  }
}

const DEBUG_KEY = "__egapro_debug";
if (typeof window !== "undefined" && !window._enableEgaproDebug) {
  window._disableEgaproDebug = () => {
    localStorage.removeItem(DEBUG_KEY);
    location.reload();
  };
  window._enableEgaproDebug = () => {
    localStorage.setItem(DEBUG_KEY, DEBUG_KEY);
    location.reload();
  };
}

export interface DebugButtonProps {
  infoText?: string;
  obj: Any;
}
export const DebugButton = ({ obj, infoText }: DebugButtonProps) => {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  useEffect(() => {
    setIsDebugEnabled(localStorage.getItem(DEBUG_KEY) === DEBUG_KEY);
  }, []);

  return (
    <>
      {isDebugEnabled && (
        <Button
          size="small"
          iconId="ri-bug-2-line"
          onClick={() => {
            console.log(`[DEBUG]${infoText ? `[${infoText}]` : ""}`, obj);
          }}
          priority="tertiary no outline"
          title={`Debug${infoText ? ` ${infoText}` : ""}`}
        />
      )}
    </>
  );
};
