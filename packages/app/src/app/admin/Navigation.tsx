"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment } from "next/navigation";

export const adminMenuItems = [
  {
    text: "Liste Référents",
    href: "/admin/liste-referents",
    segment: "liste-referents",
  },
  {
    text: "Debug",
    href: "/admin/debug",
    segment: "debug",
  },
  {
    text: "Mimoquer un Siren",
    href: "/admin/impersonate",
    segment: "impersonate",
  },
  {
    text: "Liste des déclarations d'Index et de Représentation Équilibrée",
    href: "/admin/declarations",
    segment: "declarations",
  },
  {
    text: "Gestion des demandes de rattachement",
    href: "/admin/rattachements",
    segment: "rattachement",
  },
];

export const Navigation = () => {
  const segment = useSelectedLayoutSegment();

  return (
    <MainNavigation
      items={[
        {
          text: "Accueil",
          linkProps: {
            href: "/",
          },
        },
        {
          text: "Admin",
          isActive: true,
          menuLinks: adminMenuItems.map(item => ({
            text: item.text,
            linkProps: {
              href: item.href,
            },
            isActive: segment === item.segment,
          })),
        },
      ]}
    />
  );
};
