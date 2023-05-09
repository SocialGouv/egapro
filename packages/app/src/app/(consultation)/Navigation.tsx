"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment } from "next/navigation";

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
          text: "Index égalité professionnelle",
          linkProps: {
            href: "/index-egapro/recherche",
          },
          isActive: segment === "index-egapro",
        },
        {
          text: "Représentation équilibrée",
          linkProps: {
            href: "/representation-equilibree/recherche",
          },
          isActive: segment === "representation-equilibree",
        },
      ]}
    />
  );
};
