"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert, { type AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect } from "react";

export interface AlertMessageProps {
  /** true to bypass the default scroll motion */
  disableScrollOnTop?: boolean;
  /** error message to display */
  message?: string;
  /** Alert severity */
  severity?: AlertProps.Severity;
  /** title of the Alert */
  title: string;
}

/**
 * Animated alert component for message.
 */
export const AlertMessage = ({ message, title, severity = "error", disableScrollOnTop = false }: AlertMessageProps) => {
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  useEffect(() => {
    if (message && !disableScrollOnTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [disableScrollOnTop, message]);

  return (
    <div ref={animationParent}>
      {message && <Alert severity={severity} className={fr.cx("fr-my-4w")} title={title} description={message} />}
    </div>
  );
};
