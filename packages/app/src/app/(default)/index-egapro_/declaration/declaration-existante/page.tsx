"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import { config } from "@common/config";
import { NextLinkOrA } from "@components/utils/NextLinkOrA";
import { Grid, GridCol } from "@design-system";
import { useDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/navigation";

import { funnelConfig } from "../declarationFunnelConfiguration";
import { DeclarationRecap } from "./DeclarationRecap";

const stepName = "declaration-existante";

const Page = () => {
  const router = useRouter();
  const { formData } = useDeclarationFormManager();

  const siren = formData.commencer?.entrepriseDéclarante?.siren;
  const year = formData.commencer?.annéeIndicateurs;

  const { declaration, error } = useDeclaration(siren, year);

  const olderThanOneYear = !declaration?.data.déclaration.date
    ? undefined
    : isAfter(new Date(), add(new Date(declaration.data.déclaration.date), { years: 1 }));

  if (!declaration?.data || olderThanOneYear === undefined) return <p>Chargement...</p>;

  if (error) <p>Une erreur a été rencontrée par l'API.</p>;

  return (
    <>
      {olderThanOneYear ? (
        <p>
          Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé.
        </p>
      ) : (
        <Alert
          severity="warning"
          title="Cette déclaration a été validée et transmise."
          description="Vous pouvez la modifier, une fois validée et transmise, elle remplacera la déclaration actuelle."
        />
      )}
      <DeclarationRecap déclaration={declaration?.data} />

      <ButtonsGroup
        className={fr.cx("fr-mb-3w")}
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
            type: "button",
          },
          {
            children: "Suivant",
            type: "submit",
            nativeButtonProps: {},
          },
        ]}
      />

      <Grid mt="6w" align="center">
        <GridCol md={10} lg={8}>
          <Card
            title="xxx"
            detail={
              <>
                <NextLinkOrA href={`${config.api_url}/declaration/${siren}/${year}/pdf`}>
                  Télécharger le récapitulatif
                </NextLinkOrA>
                <br />
                Année {declaration.data.déclaration.année_indicateurs + 1} au titre des données{" "}
                {declaration.data.déclaration.année_indicateurs}.
              </>
            }
          />
        </GridCol>
      </Grid>
    </>
  );
};

export default Page;
