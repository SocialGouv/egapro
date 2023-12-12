"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import { Box } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

const MonProfilPage = () => {
  const session = useSession();

  const user = session.data?.user;

  return (
    <MessageProvider>
      <Box my="8w">
        <Card
          background
          badge={user?.email ? <Badge severity="new">Staff</Badge> : null}
          border
          desc={
            <>
              <p className={fr.cx("fr-mt-4w")}>{`${user?.firstname} ${user?.lastname}`}</p>
              <p>{user?.email}</p>
            </>
          }
          enlargeLink
          horizontal
          imageAlt="texte alternatif de l’image"
          imageUrl="https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png"
          //imageUrl="ri-user-line"
          linkProps={{
            href: "/mon-espace/mes-declarations",
          }}
          size="medium"
          // start={
          //   <>
          //     <p>{`${user?.firstname} ${user?.lastname}`}</p>
          //     <p>{user?.email}</p>
          //   </>
          // }
          title="Mes déclarations"
          titleAs="h3"
        />
      </Box>
    </MessageProvider>
  );
};

export default MonProfilPage;
