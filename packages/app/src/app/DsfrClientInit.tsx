"use client";

import { useEffect } from "react";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

export function DsfrClientInit() {
  useEffect(() => {
    startReactDsfr({
      defaultColorScheme: "system",
    });
  }, []);

  return null;
}
