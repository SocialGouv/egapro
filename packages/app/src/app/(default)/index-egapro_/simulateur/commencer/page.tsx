import Button from "@codegouvfr/react-dsfr/Button";
import { CenteredContainer } from "@design-system";

const title = "Commencer";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const CommencerPage = async () => {
  return (
    <CenteredContainer>
      <h1>{title}</h1>
      <p>
        Vous allez commencer le calcul des indicateurs et de l'index de l'égalité professionnelle pour votre entreprise
        ou unité économique et sociale (UES).
      </p>
      <p>
        Suite au calcul, vous pourrez poursuivre vers la déclaration afin de transmettre les résultats obtenus aux
        services du ministre chargé du travail en renseignant les autres informations nécessaires à la déclaration.
      </p>
      <Button linkProps={{ href: "/index-egapro_/simulateur/effectifs" }}>Suivant</Button>
    </CenteredContainer>
  );
};

export default CommencerPage;
