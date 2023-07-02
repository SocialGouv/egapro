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
          text: "Admin",
          isActive: true,
          menuLinks: [
            {
              text: "Liste Référents",
              linkProps: {
                href: "/admin/liste-referents",
              },
              isActive: segment === "liste-referents",
            },
          ],
        },
      ]}
    />
  );
};
