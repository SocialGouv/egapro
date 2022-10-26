import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";

import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Box,
  ButtonAsLink,
  ButtonGroup,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentDetails,
  CardBodyContentEnd,
  CardBodyContentTitle,
  FormButton,
  Grid,
  GridCol,
} from "@design-system";
import { useFormManager, useUser } from "@services/apiClient";

const title = "Transmission de la procédure";

const Transmission: NextPageWithLayout = () => {
  useUser({ redirectTo: "/ecart-rep/email" });
  const router = useRouter();
  const { resetFormData } = useFormManager();

  const initNewRepartition = () => {
    resetFormData();
    router.push("./commencer");
  };

  return (
    <>
      <h1>{title}</h1>
      <p>
        Vous avez transmis aux services du ministre chargé du travail vos écarts éventuels de représentation
        femmes-hommes conformément aux dispositions de l’
        <a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617" target="_blank" rel="noreferrer">
          article D. 1142-19 du code du travail
        </a>
        .
      </p>
      <p>
        Vous allez recevoir un accusé de réception de votre transmission sur l’email que vous avez déclaré et validé en
        début de procédure. Cet accusé de réception contient un lien vous permettant de revenir sur votre déclaration.
      </p>
      <p>
        Si vous ne recevez pas cet accusé, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre dossier de
        courriers indésirables, vous pouvez aussi <a>demander d’envoyer à nouveau l’accusé de réception</a>.
      </p>
      <p>Nous vous remercions de votre transmission.</p>
      <Box mt="6w">
        <form>
          <ButtonGroup inline="mobile-up">
            <FormButton type="button" variant="secondary">
              Renvoyer l'accusé de réception
            </FormButton>
            <NextLink href="/ecart-rep/assujetti/" passHref>
              <ButtonAsLink onClick={initNewRepartition}>Effectuer une nouvelle déclaration</ButtonAsLink>
            </NextLink>
          </ButtonGroup>
        </form>
      </Box>
      <Grid mt="6w">
        <GridCol lg={6}>
          <Card size="sm" isEnlargeLink>
            <CardBody>
              <CardBodyContent>
                <CardBodyContentTitle>
                  <a href="#">Télécharger le récapitulatif</a>
                </CardBodyContentTitle>
                <CardBodyContentDescription>Année 2022 au titre des données 2021.</CardBodyContentDescription>
                <CardBodyContentEnd>
                  <CardBodyContentDetails>PDF – 61,88 Ko</CardBodyContentDetails>
                </CardBodyContentEnd>
              </CardBodyContent>
            </CardBody>
          </Card>
        </GridCol>
      </Grid>
    </>
  );
};

Transmission.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout haveBottomSection={true}>{children}</RepartitionEquilibreeLayout>;
};

export default Transmission;
