"use client";

import { startReactDsfr } from "@codegouvfr/react-dsfr/next-appdir";
import Link from "next/link";

import { defaultColorScheme } from "./defaultColorScheme";

declare module "@codegouvfr/react-dsfr/next-appdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

startReactDsfr({ defaultColorScheme, Link, checkNonce: true });

export function StartDsfr() {
  return null;
}
