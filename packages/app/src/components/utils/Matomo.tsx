"use client";

import { config } from "@common/config";
import { init, push } from "@socialgouv/matomo-next";
import { useEffect, useState } from "react";

import { useGdprStore } from "../../design-system/base/custom/ConsentBanner";

export type MatomoProps = Pick<typeof config, "env">;

export const Matomo = ({ env }: MatomoProps) => {
  const matomoConsent = useGdprStore(state => state.consents.matomo);
  const [inited, setInited] = useState(false);

  useEffect(() => {
    if (env === "prod" && !inited) {
      init({
        ...config.matomo,
        onInitialization: () => {
          push(["enableHeartBeatTimer"]);
          push(["requireCookieConsent"]);
        },
      });
      setInited(true);
    }

    if (matomoConsent) {
      console.log("Activation des cookies Matomo.");
      push(["rememberCookieConsentGiven"]);
    } else {
      console.log("Désactivation des cookies Matomo.");
      push(["forgetCookieConsentGiven"]);
    }
  }, [env, inited, matomoConsent]);

  return <></>;
};
