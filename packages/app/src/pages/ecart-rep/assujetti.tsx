import * as React from "react";
import { useState } from "react";

import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import { ButtonAsLink, Callout, FormRadioGroup, FormRadioGroupInput } from "@design-system";

const title = "Êtes-vous assujetti ?";

export default function AssujettiPage() {
  const [isAssujetti, setAssujetti] = useState("oui");

  function handleAssujettiChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAssujetti(e.target.value);
  }

  return (
    <>
      <h1>{title}</h1>
      <p>
        <strong>
          Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent publier et
          déclarer chaque année
        </strong>{" "}
        au plus tard le 1er mars leurs écarts éventuels de représentation entre les femmes et les hommes parmi, d’une
        part, leurs cadres dirigeants, et d’autre part, les membres de leurs instances dirigeantes, en parallèle de la
        publication et de la déclaration de leur Index de l’égalité professionnelle.
      </p>

      <p>
        Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l'email utilisé pour
        la déclaration ou un des emails rattachés au Siren de votre entreprise.
      </p>

      <form noValidate>
        <FormRadioGroup>
          <FormRadioGroupInput
            id="oui"
            name="assujetti"
            value="oui"
            checked={isAssujetti === "oui"}
            onChange={handleAssujettiChange}
          >
            oui, je suis concerné.e
          </FormRadioGroupInput>
          <FormRadioGroupInput
            id="non"
            name="assujetti"
            value="non"
            checked={isAssujetti === "non"}
            onChange={handleAssujettiChange}
          >
            non, je ne suis pas concerné.e
          </FormRadioGroupInput>
        </FormRadioGroup>
      </form>

      {(isAssujetti === "non" && <Callout>Lorem ipsum dolor amet...</Callout>) || (
        <ButtonAsLink href="/ecart-rep/email">Suivant</ButtonAsLink>
      )}
    </>
  );
}

AssujettiPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeStartLayout>{page}</RepartitionEquilibreeStartLayout>;
};
