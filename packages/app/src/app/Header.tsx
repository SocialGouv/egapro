"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  const navigationItems = [
    {
      text: "Accueil",
      linkProps: {
        href: "/",
        target: "_self",
      },
      isActive: pathname === "/",
    },
  ];

  return (
    <DsfrHeader
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Accueil - Egapro",
      }}
      serviceTitle="Egapro"
      serviceTagline="L'égalité professionnelle entre les femmes et les hommes"
      navigation={navigationItems}
      quickAccessItems={[
        {
          iconId: "fr-icon-account-line",
          linkProps: {
            href: "/login",
          },
          text: "Se connecter",
        },
      ]}
    />
  );
}

// Export nommé pour la compatibilité avec les imports existants
export const Header = AppHeader;
