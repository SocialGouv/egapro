import Button from "@codegouvfr/react-dsfr/Button";
import { CenteredContainer, Heading, Text } from "@design-system";

const title = "Commencer";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const CommencerPage = async () => {
  return (
    <CenteredContainer py="6w">
      <Heading as="h1" text={title} />
      <Text
        variant="bold"
        text="Vous allez commencer le calcul des indicateurs et de l'index de l'égalité professionnelle pour votre entreprise ou unité économique et sociale (UES)."
      />
      <Text text="Suite au calcul, vous pourrez poursuivre vers la déclaration afin de transmettre les résultats obtenus aux services du ministre chargé du travail en renseignant les autres informations nécessaires à la déclaration." />
      <Button
        linkProps={{ href: "/index-egapro_/simulateur/effectifs" }}
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
      >
        Suivant
      </Button>
    </CenteredContainer>
  );
};

export default CommencerPage;
