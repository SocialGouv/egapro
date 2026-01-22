"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Tile from "@codegouvfr/react-dsfr/Tile";
import { signIn, useSession } from "next-auth/react";

const MySpacePage = () => {
  const session = useSession();
  return (
    <div className={fr.cx("fr-container", "fr-my-7w")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <h1 className={fr.cx("fr-col-12", "fr-col-md", "fr-p-0")}>
          Liste de vos entreprises
        </h1>
        <ButtonsGroup
          className={fr.cx("fr-mt-1w")}
          buttons={[
            {
              children: "Ajouter une entreprise sur Proconnect",
              priority: "secondary",
              onClick: () =>
                signIn("proconnect", {
                  prompt: "select_account",
                }),
            },
          ]}
        />
      </div>
      <div className={fr.cx("fr-grid-row", "fr-mt-3w", "fr-grid-row--gutters")}>
        <span
          className={fr.cx(
            "fr-col-12",
            "fr-col-md",
            "fr-p-0",
            "fr-mt-1v",
            "fr-text--bold",
          )}
        >
          1 entreprise
        </span>
        <ButtonsGroup
          alignment="right"
          inlineLayoutWhen="always"
          className={fr.cx("fr-m-0")}
          buttons={[
            {
              children: "Liste",
              iconId: "fr-icon-list-unordered",
              priority: "secondary",
              className: fr.cx("fr-m-0"),
            },
            {
              children: "Tableau",
              iconId: "fr-icon-table-line",
              priority: "tertiary",
              className: fr.cx("fr-m-0"),
            },
          ]}
        ></ButtonsGroup>
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <Tile
          enlargeLinkOrButton
          imageSvg
          imageUrl="static/media/city-hall.27b3dc9b.svg"
          linkProps={{
            href: "#",
          }}
          classes={{}}
          start={
            <Badge noIcon severity="warning">
              EN COURS
            </Badge>
          }
          orientation="horizontal"
          small
          title="Alpha Solutions"
          titleAs="h2"
          desc={
            <>
              <span>N° SIREN : 532 847 196</span>
            </>
          }
        />
      </div>
      <span>{JSON.stringify(session)}</span>
    </div>
  );
};

export default MySpacePage;
