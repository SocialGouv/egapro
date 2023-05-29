"use client";

import { push } from "@socialgouv/matomo-next";
import { useEffect } from "react";

export interface MatomoPushProps {
  event: Parameters<typeof push>[0];
}

export const MatomoPush = ({ event }: MatomoPushProps) => {
  useEffect(() => {
    push(event);
  }, [event]);

  return <></>;
};
