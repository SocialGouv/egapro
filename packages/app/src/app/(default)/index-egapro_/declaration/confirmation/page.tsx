"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Box, DownloadCard, Grid, GridCol, ImgJDMA, ImgSuccessLight } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import Link from "next/link";

import { SendReceipt } from "./SendReceipt";

const ConfirmationPage = () => {
  const { formData } = useDeclarationFormManager();

  const hasMounted = useHasMounted();

  if (!hasMounted) return <SkeletonForm fields={2} />;

  if (formData.commencer?.annéeIndicateurs === undefined || formData.commencer?.siren === undefined)
    throw new Error("Impossible de récupérer les données de l'entreprise");

  const année = Number(formData.commencer.annéeIndicateurs);
  const siren = formData.commencer.siren;
  const index = formData["resultat-global"]?.index;

  return (
    <>
      <Box style={{ textAlign: "center" }}>
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
        <SendReceipt />
      </Box>

      <Grid align="center" mt="6w">
        <GridCol md={10}>
          <DownloadCard
            title="Télécharger le récapitulatif"
            endDetail="PDF"
            href={`/api/declaration/${siren}/${année}/pdf`}
            filename={`declaration_egapro_${siren}_${Number(année) + 1}.pdf`}
            fileType="application/pdf"
            desc={`Année ${année + 1} au titre des données ${année}`}
          />
        </GridCol>
      </Grid>

      {index !== undefined && index < 85 && (
        <Grid align="center" mt="4w">
          <GridCol md="10">
            <Card
              title="Publication et déclaration des objectifs de progression"
              footer={
                <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                  <li>
                    <Button onClick={() => alert("TODO")}>Déclarer les objectifs de progression</Button>
                  </li>
                </ul>
              }
              desc={
                <>
                  <strong>
                    Les entreprises et unités économiques et sociales (UES) ayant obtenu un index inférieur à 85 points
                    doivent fixer par accord ou, à défaut, par décision unilatérale, et publier des objectifs de
                    progression de chacun des indicateurs.
                  </strong>

                  <br />
                  <div>
                    Une fois l’accord ou la décision déposé, les objectifs de progression ainsi que leurs modalités de
                    publication doivent être transmis aux services du ministre chargé du travail et au comité social et
                    économique.Vous pouvez déclarer les objectifs de progression ultérieurement en vous connectant à
                    votre espace via le menu "Mes déclarations".
                  </div>
                </>
              }
            />
          </GridCol>
        </Grid>
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
                    href="https://egapro.travail.gouv.fr/index-egapro/"
                  >
                    Guide Mon Espace
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

      <Box style={{ textAlign: "center" }} my="6w">
        <Link
          href="https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_source=button-declaration&key=73366ddb13d498f4c77d01c2983bab48"
          target="_blank"
          rel="noreferrer"
          style={{ background: "none" }}
        >
          <ImgJDMA />
        </Link>
      </Box>
    </>
  );
};

export default ConfirmationPage;
