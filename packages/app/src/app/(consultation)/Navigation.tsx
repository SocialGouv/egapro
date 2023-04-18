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
          text: "Index",
          linkProps: {
            href: "/_consulter-index",
          },
          isActive: segment === "_consulter-index",
        },
        {
          text: "Représentation équilibrée",
          linkProps: {
            href: "/_representation-equilibree/recherche",
          },
          isActive: segment === "_representation-equilibree",
        },
      ]}
    />
  );
};
