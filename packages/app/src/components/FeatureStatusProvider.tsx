import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { Alert, AlertTitle } from "../design-system/base/Alert";

const ERROR_COLLAPSE_TIMEOUT = 5000;

export type FeatureStatus =
  | {
      message: string;
      type: "error";
    }
  | {
      type: "idle";
    }
  | {
      type: "loading";
    }
  | { message: string; type: "success" };

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

const featureStatusContext = createContext<typeof featureStatusDefault>(featureStatusDefault);
featureStatusContext.displayName = "FeatureStatusContext";

/**
 * Context provider for FeatureStatus.
 */
export const FeatureStatusProvider = ({ children }: PropsWithChildren) => {
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({ type: "idle" });

  return (
    <featureStatusContext.Provider value={{ featureStatus, setFeatureStatus }}>
      {children}
    </featureStatusContext.Provider>
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
  const context = useContext(featureStatusContext);
  const { setFeatureStatus } = context;

  if (!context)
    throw new Error("Le hook useFeatureStatus doit être utilisé à l'intérieur d'un composant FeatureStatusProvider.");

  useEffect(() => {
    if (reset) setFeatureStatus({ type: "idle" });
  }, [reset, setFeatureStatus]);

  return context;
};

/**
 * Animated alert component for error or success message.
 *
 * @param type type between error and success to respond to.
 * @param title title of the Alert
 * @param disableScrollOnTop true to bypass the default scroll motion
 * @param disableAutoDismiss true to bypass the default dissmis behaviour after some time.
 */
export const AlertFeatureStatus = ({
  type,
  title,
  disableScrollOnTop = false,
  disableAutoDismiss: disableTimer = false,
}: {
  disableAutoDismiss?: boolean;
  disableScrollOnTop?: boolean;
  title: string;
  type: Extract<FeatureStatus["type"], "error" | "success">;
}) => {
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
        <Alert type={type} mb="4w">
          <AlertTitle>{title}</AlertTitle>
          <p>{featureStatus.message}</p>
        </Alert>
      )}
    </div>
  );
};
