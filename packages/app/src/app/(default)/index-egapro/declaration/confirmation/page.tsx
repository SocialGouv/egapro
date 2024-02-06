"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Box, DownloadCard, Grid, GridCol, ImgJDMA, ImgSuccessLight } from "@design-system";
import { AlertMessage } from "@design-system/client";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { inRange } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { sendDeclarationReceipt } from "../actions";
import { funnelStaticConfig } from "../declarationFunnelConfiguration";
import style from "./style.module.css";

type Props = {
  index: number | undefined;
  siren: string;
  year: number;
};

const ButtonOpMc = ({ index, siren, year }: Props) => {
  const router = useRouter();

  if (index === undefined || index > 85) return null;

  return (
    <Button onClick={() => router.push(`/index-egapro/objectifs-mesures/${siren}/${year}`)}>
      {index >= 75
        ? "Déclarer les objectifs de progression"
        : "Déclarer les objectifs de progression et mesures de correction"}
    </Button>
  );
};

const ConfirmationPage = () => {
  const { formData, resetFormData } = useDeclarationFormManager();
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (formData.commencer?.annéeIndicateurs === undefined) {
      router.push(funnelStaticConfig["commencer"].url);
    }
  }, [formData, router]);

  if (!hasMounted) return <SkeletonForm fields={2} />;

  if (formData.commencer?.annéeIndicateurs === undefined || formData.commencer?.siren === undefined) return null;

  const year = Number(formData.commencer.annéeIndicateurs);
  const siren = formData.commencer.siren;
  const index = formData["resultat-global"]?.index;

  const initNewDeclaration = () => {
    resetFormData();
  };

  const sendReceipt = () => {
    if (!siren || !year) {
      return;
    }

    setReceiptProcessing(true);

    sendDeclarationReceipt(siren, year)
      .catch(error => {
        console.error(error);
        setError("Une erreur est survenue, veuillez réessayer ultérieurement.");
      })
      .finally(() => {
        setReceiptProcessing(false);
      });
  };

  return (
    <>
      <Box className="text-center">
        <ImgSuccessLight />
        <h1>Votre déclaration a été transmise</h1>
      </Box>

      <p>
        <strong>
          Vous avez transmis aux services du ministre chargé du travail vos résultats en matière d’écart de rémunération
          entre les femmes et les hommes conformément aux dispositions de l’article D.1142-5 du code du travail.
        </strong>
      </p>
      <p>
        Vous allez recevoir un accusé de réception de votre transmission sur l’email que vous avez déclaré et validé en
        début de procédure. Cet accusé de réception contient un lien vous permettant de revenir sur votre déclaration.
      </p>
      <p>
        Si vous ne recevez pas cet accusé, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre dossier de
        courriers indésirables ou SPAM.
      </p>
      <p>Nous vous remercions de votre transmission.</p>

      <Box my="8w">
        <AlertMessage title="Erreur" message={error} />

        <Grid align="center" haveGutters>
          <GridCol md={5}>
            <Button
              size="medium"
              className={style["send-receipt-button"]}
              priority="secondary"
              onClick={sendReceipt}
              disabled={receiptProcessing}
            >
              {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
            </Button>
          </GridCol>
          <GridCol md={5}>
            <Button
              size="medium"
              priority="secondary"
              className={style["send-receipt-button"]}
              onClick={initNewDeclaration}
            >
              Effectuer une nouvelle déclaration
            </Button>
          </GridCol>
        </Grid>
      </Box>

      <Grid align="center" mt="6w">
        <GridCol md={10}>
          <DownloadCard
            title="Télécharger le récapitulatif"
            endDetail="PDF"
            href={`/index-egapro/declaration/${siren}/${year}/pdf`}
            filename={`declaration_egapro_${siren}_${Number(year) + 1}.pdf`}
            fileType="application/pdf"
            desc={`Année ${year + 1} au titre des données ${year}`}
          />
        </GridCol>
      </Grid>

      {index !== undefined && (
        <>
          {inRange(index, 75, 85) ? (
            <Grid align="center" mt="4w">
              <GridCol md="10">
                <Card
                  title="Publication et déclaration des objectifs de progression"
                  footer={
                    <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                      <li>
                        <ButtonOpMc index={index} siren={siren} year={year} />
                      </li>
                    </ul>
                  }
                  desc={
                    <>
                      <strong>
                        Les entreprises et unités économiques et sociales (UES) ayant obtenu un index inférieur à 85
                        points doivent fixer par accord ou, à défaut, par décision unilatérale, et publier des objectifs
                        de progression de chacun des indicateurs.
                      </strong>

                      <br />
                      <div>
                        Une fois l’accord ou la décision déposé, les objectifs de progression ainsi que leurs modalités
                        de publication doivent être transmis aux services du ministre chargé du travail et au comité
                        social et économique.
                        <br />
                        Vous pouvez déclarer les objectifs de progression ultérieurement en vous connectant à votre
                        espace via le menu "Mes déclarations".
                      </div>
                    </>
                  }
                />
              </GridCol>
            </Grid>
          ) : (
            index < 75 && (
              <>
                <Grid align="center" mt="4w">
                  <GridCol md="10">
                    <Card
                      title="Publication et déclaration des objectifs de progression et mesures de correction"
                      footer={
                        <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                          <li>
                            <ButtonOpMc index={index} siren={siren} year={year} />
                          </li>
                        </ul>
                      }
                      desc={
                        <>
                          <strong>
                            Les entreprises et unités économiques et sociales (UES) ayant obtenu un index inférieur à 75
                            points doivent publier
                          </strong>
                          , par une communication externe et au sein de l’entreprise,{" "}
                          <strong>les mesures de correction</strong> qu’elles ont définies par accord ou, à défaut, par
                          décision unilatérale. <strong>Par ailleurs, elles doivent fixer</strong>, également par accord
                          ou, à défaut, par décision unilatérale,{" "}
                          <strong>et publier des objectifs de progression</strong> de chacun des indicateurs.
                          <br />
                          Une fois l’accord ou la décision déposé, les informations relatives aux mesures de correction,
                          les objectifs de progression ainsi que leurs modalités de publication doivent être transmis
                          aux services du ministre chargé du travail et au comité social et économique.
                          <br />
                          <div>
                            Vous pouvez déclarer les objectifs de progression et mesures de correction ultérieurement en
                            vous connectant à votre espace via le menu "Mes déclarations".
                          </div>
                        </>
                      }
                    />
                  </GridCol>
                </Grid>
              </>
            )
          )}
        </>
      )}
      <Grid align="center" mt="4w">
        <GridCol md="10">
          <Card
            title="Informations"
            footer={
              <ul className="fr-links-group">
                <li>
                  <a
                    className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                    href="/mon-espace/mes-declarations"
                  >
                    Accéder à mon espace
                  </a>
                </li>
              </ul>
            }
            desc={
              <>
                <p>
                  <strong>
                    Dans votre espace, accessible via votre email en haut à droite, vous avez accès à la liste des
                    déclarations de l’index qui ont été transmises à l’administration dans le menu "Mes déclarations".
                  </strong>
                </p>
                <p>Vous pouvez également télécharger le récapitulatif de vos déclarations.</p>
              </>
            }
          />
        </GridCol>
      </Grid>
      <Box className="text-center" my="6w">
        <Link
          href="https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_source=button-declaration&key=73366ddb13d498f4c77d01c2983bab48"
          target="_blank"
          rel="noreferrer"
          className="no-bg"
        >
          <ImgJDMA />
        </Link>
      </Box>
    </>
  );
};

export default ConfirmationPage;
