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
    {
      text: "Index de l'égalité professionnelle",
      linkProps: {
        href: "/index-egapro",
        target: "_self",
      },
      isActive: pathname?.startsWith("/index-egapro"),
    },
    {
      text: "Écarts de représentation F/H",
      linkProps: {
        href: "/representation-equilibree",
        target: "_self",
      },
      isActive: pathname?.startsWith("/representation-equilibree"),
    },
    {
      text: "Aide",
      linkProps: {
        href: "/aide",
        target: "_self",
      },
      isActive: pathname?.startsWith("/aide"),
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
            href: "/mon-espace",
          },
          text: "Mon espace",
        },
      ]}
    />
  );
}

// Export nommé pour la compatibilité avec les imports existants
export const Header = AppHeader;
