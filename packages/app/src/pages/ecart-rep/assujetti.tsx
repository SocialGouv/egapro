import NextLink from "next/link";
import { useState } from "react";

import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import { ButtonAsLink, Callout, FormRadioGroup, FormRadioGroupInput } from "@design-system";
import { useUser } from "@services/apiClient";

const title = "Êtes-vous assujetti ?";

const AssujettiPage: NextPageWithLayout = () => {
  const [isAssujetti, setAssujetti] = useState("oui");
  const { isAuthenticated } = useUser();

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

      <form noValidate>
        <FormRadioGroup>
          <FormRadioGroupInput
            id="oui"
            name="assujetti"
            value="oui"
            checked={isAssujetti === "oui"}
            onChange={handleAssujettiChange}
          >
            oui, je suis concerné
          </FormRadioGroupInput>
          <FormRadioGroupInput
            id="non"
            name="assujetti"
            value="non"
            checked={isAssujetti === "non"}
            onChange={handleAssujettiChange}
          >
            non, je ne suis pas concerné
          </FormRadioGroupInput>
        </FormRadioGroup>
      </form>

      {(isAssujetti === "non" && (
        <Callout>
          Vous n'êtes pas assujetti à la publication et à la déclaration des écarts éventuels de représentation entre
          les femmes et les hommes.{" "}
          <NextLink href="/ecart-rep/" passHref>
            <ButtonAsLink>Retour à la page d'accueil.</ButtonAsLink>
          </NextLink>
        </Callout>
      )) || (
        <NextLink href={isAuthenticated ? "/ecart-rep/commencer" : "/ecart-rep/email"} passHref>
          <ButtonAsLink>Suivant</ButtonAsLink>
        </NextLink>
      )}
    </>
  );
};

AssujettiPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default AssujettiPage;
