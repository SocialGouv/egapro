import Alert from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { Link } from "@design-system";

const proconnectSignInUrl = config.proconnect.signinUrl;

export const EntreprisesInfoAlert = () => (
  <Alert
    severity="info"
    small
    description={
      <>
        <p>Dans ce menu, vous pouvez consulter les adresses emails rattachées à votre entreprise.</p>
        <br />
        <p>
          Pour qu'une autre personne puisse déclarer pour cette entreprise, elle doit se connecter à Egapro avec son
          propre compte{" "}
          <Link target="_blank" href={`${proconnectSignInUrl}`}>
            ProConnect
          </Link>{" "}
          rattaché à cette entreprise.
        </p>
      </>
    }
  />
);
