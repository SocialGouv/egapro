"use client";

import { fr } from "@codegouvfr/react-dsfr";

type Message = { severity: "error" | "success" | "warning"; text: string; title?: string };

const defaultMessage = { severity: "error", text: "", title: "" } as Message;
const defaultContext = [defaultMessage, (() => {}) as (message: Message) => void] as const;

const MessageContext = createContext(defaultContext);

export const MessageProvider = ({ children }: PropsWithChildren) => {
  const state = useState(defaultMessage);

  return <MessageContext.Provider value={state}>{children}</MessageContext.Provider>;
};

export const useMessageProvider = () => {
  const [message, setMessage] = useContext(MessageContext);

  if (!message) throw new Error("The hook useMessageProvider must be used inside a MessageProvider component");

  return { message, setMessage };
};

import Alert, { type AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

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

export const AlertMessageWithProvider = ({
  disableScrollOnTop = false,
}: Pick<AlertMessageProps, "disableScrollOnTop">) => {
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const {
    message: { severity, text, title = "" },
  } = useMessageProvider();

  useEffect(() => {
    if (text && !disableScrollOnTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [disableScrollOnTop, text]);

  return (
    <div ref={animationParent}>
      {text && severity && <Alert severity={severity} className={fr.cx("fr-my-4w")} title={title} description={text} />}
    </div>
  );
};

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
