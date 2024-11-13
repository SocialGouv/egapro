"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Box, Grid, GridCol, ImgJDMA, ImgSuccessLight } from "@design-system";
import { AlertMessage } from "@design-system/client";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { inRange } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { sendDeclarationReceipt } from "../actions";
import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type Props = {
  index: number | undefined;
  siren: string;
  year: number;
};

const ButtonOpMc = ({ index, siren, year }: Props) => {
  if (index === undefined || index > 85) return null;

  return (
    <Button onClick={() => window.open(`/index-egapro/objectifs-mesures/${siren}/${year}`, "_blank")}>
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
          Vous allez recevoir un accusé de réception de cette transmission sur votre adresse email. Si vous ne recevez
          pas cet accusé, vérifiez que celui-ci n’est pas dans vos courriers indésirables ou SPAM.
        </strong>
      </p>
      <p>
        <Link
          href={`/index-egapro/declaration/${siren}/${year}/pdf`}
          target="_blank"
          download={`declaration_egapro_${siren}_${Number(year) + 1}.pdf`}
          prefetch={false}
          replace={false}
          type="application/pdf"
          rel="noopener noreferer"
        >
          Télécharger le récapitulatif de la déclaration
        </Link>
      </p>

      <Box className="text-center bg-dsfr-alt-grey" my="6w">
        <p>
          <strong>Aidez-nous à améliorer Egapro</strong>
        </p>
        <Box>
          <Link
            href="https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_source=button-declaration&key=73366ddb13d498f4c77d01c2983bab48"
            target="_blank"
            rel="noreferrer"
            className="no-bg"
          >
            <ImgJDMA />
          </Link>
        </Box>
      </Box>
      <h1>Et après</h1>
      {index !== undefined && year >= 2021 && (
        <>
          {inRange(index, 75, 85) ? (
            <Box>
              <Card
                title="Vous avez obtenu un index compris entre 75 et 84 points inclus"
                desc={<span>Vous devez fixer, publier et déclarer des objectifs de progression.</span>}
                footer={<ButtonOpMc index={index} siren={siren} year={year} />}
              />
            </Box>
          ) : (
            index < 75 && (
              <Box>
                <Card
                  title="Vous avez obtenu un index inférieur à 75 points"
                  desc={
                    <span>
                      Vous devez fixer, publier et déclarer des objectifs de progression et mesures de correction.
                    </span>
                  }
                  footer={<ButtonOpMc index={index} siren={siren} year={year} />}
                />
              </Box>
            )
          )}
        </>
      )}
      <Box>
        <Card
          title="Mon espace personnel"
          desc={
            <span>
              Vos déclarations transmises sont disponibles dans le menu “Mes déclarations” de votre espace personnel
              (adresse email en haut à droite).
            </span>
          }
          footer={
            <Button
              linkProps={{
                href: "/mon-espace/mes-declarations",
                target: "_blank",
              }}
            >
              Accéder à mon espace
            </Button>
          }
        />
      </Box>
      <Box my="8w">
        <AlertMessage title="Erreur" message={error} />

        <Grid haveGutters>
          <GridCol md={6}>
            <Card
              title="Vous n'avez pas reçu l’accusé de réception"
              footer={
                <Button onClick={sendReceipt} disabled={receiptProcessing}>
                  {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
                </Button>
              }
            />
          </GridCol>
          <GridCol md={6}>
            <Card
              title="Vous souhaitez effectuer une nouvelle déclaration"
              footer={<Button onClick={initNewDeclaration}>Effectuer une nouvelle déclaration</Button>}
            />
          </GridCol>
        </Grid>
      </Box>
    </>
  );
};

export default ConfirmationPage;
