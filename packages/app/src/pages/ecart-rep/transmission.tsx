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
  ImgSuccess,
} from "@design-system";
import { useFormManager, useUser, fetchRepartitionEquilibreeSendEmail } from "@services/apiClient";

const title = "Transmission de la procédure";

const Transmission: NextPageWithLayout = () => {
  useUser({ redirectTo: "/ecart-rep/email" });
  const router = useRouter();
  const { formData, resetFormData } = useFormManager();

  const initNewRepartition = () => {
    resetFormData();
    router.push("./commencer");
  };

  const sendReceipt = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (formData.entreprise?.siren && formData.year) {
      fetchRepartitionEquilibreeSendEmail(formData.entreprise.siren, formData.year);
    }
  };

  return (
    <>
      <Grid justifyCenter mb="4w">
        <GridCol sm={8} md={5}>
          <ImgSuccess />
        </GridCol>
      </Grid>
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
        courriers indésirables.
      </p>
      <p>Nous vous remercions de votre transmission.</p>
      <Box mt="6w">
        <form>
          <ButtonGroup inline="mobile-up">
            <FormButton type="button" variant="secondary" onClick={sendReceipt}>
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
                <CardBodyContentDescription>
                  Année {formData.year && formData.year + 1} au titre des données {formData.year}.
                </CardBodyContentDescription>
                <CardBodyContentEnd>
                  <CardBodyContentDetails>PDF – 30 Ko</CardBodyContentDetails>
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
