import { BackNextButtonsGroup, CenteredContainer, Heading, Text } from "@design-system";

import { TITLES } from "../(funnel)/navigation";

const title = TITLES.commencer;

export const metadata = {
  title: {
    absolute: `${title} - Calcul d'index`,
  },
  openGraph: {
    title: {
      absolute: `${title} - Calcul d'index`,
    },
  },
};

const CommencerPage = async () => {
  return (
    <CenteredContainer pb="6w">
      <Heading as="h1" text={title} />
      <Text
        variant="bold"
        text="Vous allez commencer le calcul des indicateurs et de l'index de l'égalité professionnelle pour votre entreprise ou unité économique et sociale (UES)."
      />
      <Text text="Suite au calcul, vous pourrez poursuivre vers la déclaration afin de transmettre les résultats obtenus aux services du ministre chargé du travail en renseignant les autres informations nécessaires à la déclaration." />

      <BackNextButtonsGroup
        noBack
        nextProps={{
          linkProps: {
            href: "/index-egapro/simulateur/effectifs",
            id: "begin-button",
          },
        }}
      />
    </CenteredContainer>
  );
};

export default CommencerPage;
