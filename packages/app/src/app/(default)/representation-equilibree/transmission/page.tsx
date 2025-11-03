import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { Box, CenteredContainer, ImgJDMA, ImgSuccessLight, Link } from "@design-system";

import { DownloadRepeqPdf } from "./DownloadRepeqPdf";
import { SendReceipt } from "./SendReceipt";

const title = "Transmission";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Transmission = () => {
  return (
    <>
      <CenteredContainer pb="6w">
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
        <DownloadRepeqPdf />
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
        <SendReceipt />
      </CenteredContainer>
    </>
  );
};

export default Transmission;
