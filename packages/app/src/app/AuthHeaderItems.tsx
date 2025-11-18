"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { ConfigContext } from "@components/utils/ConfigProvider";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { config as appConfig } from "@common/config";
import { signOut, useSession } from "next-auth/react";
import { useContext } from "react";

import { HeaderAccountMenu } from "./HeaderAccountMenu";

export const UserHeaderItem = () => {
  const session = useSession();
  const config = useContext(ConfigContext);

  let isStaff = false;
  switch (session.status) {
    case "authenticated":
      isStaff = session.data.user.staff || session.data.staff.impersonating || false;
      return (
        <HeaderAccountMenu
          staff={isStaff}
          session={session}
          isEmailLogin={config.isEmailLogin}
          isProConnectTest={config.isProConnectTest}
        />
      );
    case "loading":
      return (
        <HeaderQuickAccessItem
          key="hqai-authloading-fake-user"
          quickAccessItem={{
            iconId: "fr-icon-account-fill",
            text: <Skeleton width={200} highlightColor="var(--text-action-high-blue-france)" />,
            linkProps: {
              href: "#",
              onClick(e) {
                e.preventDefault();
              },
            },
          }}
        />
      );
    default:
      return null;
  }
};

export const LoginLogoutHeaderItem = () => {
  const session = useSession();

  switch (session.status) {
    case "authenticated":
      return (
        <HeaderQuickAccessItem
          key="hqai-authenticated-logout"
          quickAccessItem={{
            iconId: "fr-icon-lock-unlock-line",
            buttonProps: {
              className: fr.cx("fr-btn--secondary"),
              async onClick(e) {
                e.preventDefault();
                // Sign out from NextAuth first
                await signOut({ callbackUrl: "/" });
                // Then redirect to Keycloak logout to clear the OAuth session
                const idTokenHint = session.data.user.idToken;
                const redirectUri = encodeURIComponent(window.location.origin);
                const isLocal = appConfig.proconnect.issuer.includes("localhost");
                let logoutUrl: string;
                if (isLocal) {
                  logoutUrl = idTokenHint
                    ? `http://localhost:8081/realms/atlas/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(idTokenHint)}&post_logout_redirect_uri=${redirectUri}`
                    : `http://localhost:8081/realms/atlas/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUri}`;
                } else {
                  // For dev and prod, use specific logout URLs
                  const logoutBaseUrl = appConfig.env === "prod"
                    ? "https://app.proconnect.gouv.fr/api/v2"
                    : appConfig.proconnect.issuer;
                  logoutUrl = `${logoutBaseUrl}/logout?id_token_hint=${encodeURIComponent(idTokenHint || "")}&post_logout_redirect_uri=${redirectUri}`;
                }
                window.location.href = logoutUrl;
              },
            },
            text: "Se déconnecter",
          }}
        />
      );

    default: // loading
      return (
        <HeaderQuickAccessItem
          key="hqai-unauthenticated-login"
          quickAccessItem={{
            iconId: "fr-icon-lock-line",
            linkProps: {
              href: "/login",
              className: fr.cx("fr-btn--secondary"),
            },
            text: "Se connecter",
          }}
        />
      );
  }
};
