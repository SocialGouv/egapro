"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { type PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";

const ERROR_COLLAPSE_TIMEOUT = 5000;

export type FeatureStatus =
  | {
      message: string;
      type: "error" | "success";
    }
  | {
      type: "idle";
    }
  | {
      type: "loading";
    };

type FeatureStatusContextType = {
  featureStatus: FeatureStatus;
  setFeatureStatus: (status: FeatureStatus) => void;
};

const featureStatusDefault: FeatureStatusContextType = {
  featureStatus: {
    type: "idle",
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFeatureStatus: _status => {},
};

const FeatureStatusContext = createContext(featureStatusDefault);
FeatureStatusContext.displayName = "FeatureStatusContext";

/**
 * Context provider for FeatureStatus.
 */
export const FeatureStatusProvider = ({ children }: PropsWithChildren) => {
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({ type: "idle" });

  return (
    <FeatureStatusContext.Provider value={{ featureStatus, setFeatureStatus }}>
      {children}
    </FeatureStatusContext.Provider>
  );
};

/**
 * Hook to consume featureStatusContext.
 *
 * This hooks needs to be used in a component which an ancestor is a FeatureStatusProvider component.
 *
 * @param reset true if you want to reinitialize the featureStatus (useful for pages component e. g.).
 */
export const useFeatureStatus = ({ reset = false }: { reset?: boolean } = {}) => {
  const context = useContext(FeatureStatusContext);
  const { setFeatureStatus } = context;

  if (!context)
    throw new Error("Le hook useFeatureStatus doit être utilisé à l'intérieur d'un composant FeatureStatusProvider.");

  useEffect(() => {
    if (reset) setFeatureStatus({ type: "idle" });
  }, [reset, setFeatureStatus]);

  return context;
};

export interface AlertFeatureStatusProps {
  /** true to bypass the default dissmis behaviour after some time. */
  disableAutoDismiss?: boolean;
  /** true to bypass the default scroll motion */
  disableScrollOnTop?: boolean;
  /** title of the Alert */
  title: string;
  /** type between error and success to respond to. */
  type: Extract<FeatureStatus["type"], "error" | "success">;
}

/**
 * Animated alert component for error or success message.
 */
export const AlertFeatureStatus = ({
  type,
  title,
  disableScrollOnTop = false,
  disableAutoDismiss: disableTimer = false,
}: AlertFeatureStatusProps) => {
  const { featureStatus, setFeatureStatus } = useFeatureStatus();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  // Remove error message after some timeout.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!disableTimer) {
      if (featureStatus.type === type) {
        timeoutId = setTimeout(() => {
          setFeatureStatus({ type: "idle" });
        }, ERROR_COLLAPSE_TIMEOUT);
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [disableTimer, featureStatus, setFeatureStatus, type]);

  useEffect(() => {
    if (!disableScrollOnTop) {
      if (featureStatus.type === type) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [featureStatus, disableScrollOnTop, type]);

  return (
    <div ref={animationParent}>
      {featureStatus.type === type && (
        <Alert severity={type} className={fr.cx("fr-my-4w")} title={title} description={featureStatus.message} />
      )}
    </div>
  );
};
