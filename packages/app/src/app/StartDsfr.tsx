"use client";

import { startReactDsfr } from "@codegouvfr/react-dsfr/next-appdir";
import Link from "next/link";

import { defaultColorScheme } from "./defaultColorScheme";

declare module "@codegouvfr/react-dsfr/next-appdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module "@codegouvfr/react-dsfr/gdpr" {
  interface RegisterGdprServices {
    egapro: true;
    matomo: never;
  }
}

startReactDsfr({ defaultColorScheme, Link });

export function StartDsfr() {
  return null;
}
