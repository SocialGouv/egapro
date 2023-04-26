import { config } from "@common/config";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { type FormButtonProps } from "@design-system";
import {
  ButtonAsLink,
  ButtonGroup,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentDetails,
  CardBodyContentEnd,
  CardBodyContentTitle,
  CardHeader,
  CardHeaderImg,
  Container,
  FormButton,
  Grid,
  GridCol,
  ImgHome,
  ImgJDMA,
  TileSuccess,
  TileSuccessTitle,
} from "@design-system";
import { fetchRepresentationEquilibreeSendEmail, useFormManager } from "@services/apiClient";
import { useRouter } from "next/router";
import { useState } from "react";

import { NextLinkOrA } from "../../design-system/utils/NextLinkOrA";
import { type NextPageWithLayout } from "../_app";

const title = "Votre déclaration a été transmise";

const Transmission: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, resetFormData } = useFormManager();
  const [receiptProcessing, setReceiptProcessing] = useState(false);

  const initNewRepresentation = () => {
    resetFormData();
    router.push("./commencer");
  };

  const sendReceipt: NonNullable<FormButtonProps["onClick"]> = e => {
    e.preventDefault();
    if (formData.entreprise?.siren && formData.year) {
      setReceiptProcessing(true);
      fetchRepresentationEquilibreeSendEmail(formData.entreprise.siren, formData.year).finally(() =>
        setReceiptProcessing(false),
      );
    }
  };

  return (
    <>
      <TileSuccess>
        <TileSuccessTitle titleAs="h1">{title}</TileSuccessTitle>
        <p>
          Vous avez transmis aux services du ministre chargé du travail vos écarts éventuels de représentation
          femmes-hommes conformément aux dispositions de l’
          <a
            href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617"
            target="_blank"
            rel="noreferrer"
          >
            article D. 1142-19 du code du travail
          </a>
          .
        </p>
        <p>
          Vous allez recevoir un accusé de réception de votre transmission sur l’email que vous avez déclaré et validé
          en début de procédure. Cet accusé de réception contient un lien vous permettant de revenir sur votre
          déclaration.
        </p>
        <p>
          Si vous ne recevez pas cet accusé, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre dossier
          de courriers indésirables.
        </p>
        <p>Nous vous remercions de votre transmission.</p>
        <Grid mt="6w" align="center">
          <GridCol md={10} lg={8}>
            <form>
              <ButtonGroup>
                <FormButton type="button" variant="secondary" onClick={sendReceipt} disabled={receiptProcessing}>
                  {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
                </FormButton>
                <ButtonAsLink href="/representation-equilibree/assujetti/" onClick={initNewRepresentation}>
                  Effectuer une nouvelle déclaration
                </ButtonAsLink>
              </ButtonGroup>
            </form>
          </GridCol>
        </Grid>
        {formData.entreprise?.siren && (
          <Grid mt="6w" align="center">
            <GridCol md={10} lg={8}>
              <Card size="sm" isEnlargeLink>
                <CardBody>
                  <CardBodyContent>
                    <CardBodyContentTitle>
                      <a
                        href={`${config.api_url}/representation-equilibree/${formData.entreprise?.siren}/${formData.year}/pdf`}
                      >
                        Télécharger le récapitulatif
                      </a>
                    </CardBodyContentTitle>
                    <CardBodyContentDescription>
                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                      Année {formData.year! + 1} au titre des données {formData.year}.
                    </CardBodyContentDescription>
                    <CardBodyContentEnd>
                      <CardBodyContentDetails>PDF</CardBodyContentDetails>
                    </CardBodyContentEnd>
                  </CardBodyContent>
                </CardBody>
              </Card>
            </GridCol>
          </Grid>
        )}
        <Grid mt="6w" align="center" haveGutters>
          <GridCol md={10} lg={8} className="fr-enlarge-link">
            <NextLinkOrA
              isExternal
              // TODO: separate component with key as env
              href="https://jedonnemonavis.numerique.gouv.fr/Demarches/3494?&view-mode=formulaire-avis&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
              target="_blank"
              rel="noreferrer"
            >
              <ImgJDMA />
            </NextLinkOrA>
          </GridCol>
        </Grid>
      </TileSuccess>
      <Container mt="12w">
        <Card size="sm" isEnlargeLink noBorder isHorizontal>
          <CardBody>
            <CardBodyContent>
              <CardBodyContentTitle>
                <NextLinkOrA isExternal href="https://egapro.travail.gouv.fr">
                  Avez-vous déclaré l’index égalité professionnelle F/H&nbsp;?
                </NextLinkOrA>
              </CardBodyContentTitle>
              <CardBodyContentDescription>
                Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de l’égalité
                professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
              </CardBodyContentDescription>
            </CardBodyContent>
          </CardBody>
          <CardHeader>
            <CardHeaderImg>
              <ImgHome />
            </CardHeaderImg>
          </CardHeader>
        </Card>
      </Container>
    </>
  );
};

Transmission.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Transmission">{children}</RepresentationEquilibreeLayout>;
};

export default Transmission;
