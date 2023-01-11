import {
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentDetails,
  CardBodyContentEnd,
  CardBodyContentStart,
  CardBodyContentTitle,
  CardBodyFooter,
  Link,
  LinkGroup,
} from "@design-system";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/carte" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Card>;

export const Default: ComponentStory<typeof Card> = args => {
  return (
    <Card {...args}>
      <CardBody>
        <CardBodyContent>
          <CardBodyContentStart>
            <CardBodyContentDetails icon="fr-icon-arrow-right-line">Définition</CardBodyContentDetails>
          </CardBodyContentStart>
          <CardBodyContentTitle>Membres des instances dirigeantes</CardBodyContentTitle>
          <CardBodyContentDescription>
            Est considérée comme instance dirigeante toute instance mise en place au sein de la société, par tout acte
            ou toute pratique sociétaire, aux fins d'assister régulièrement les organes chargés de la direction générale
            dans l'exercice de leurs missions.
          </CardBodyContentDescription>
        </CardBodyContent>
        <CardBodyFooter>
          <LinkGroup>
            <Link href="#" iconRight="fr-icon-arrow-right-line">
              Lien simple
            </Link>
          </LinkGroup>
        </CardBodyFooter>
      </CardBody>
    </Card>
  );
};

export const IsEnlargeLink: ComponentStory<typeof Card> = args => {
  return (
    <Card isEnlargeLink {...args}>
      <CardBody>
        <CardBodyContent>
          <CardBodyContentTitle>
            <a href="#">Télécharger le récapitulatif</a>
          </CardBodyContentTitle>
          <CardBodyContentDescription>Année 2023 au titre des données 2022.</CardBodyContentDescription>
          <CardBodyContentEnd>
            <CardBodyContentDetails>PDF – 61,88 Ko</CardBodyContentDetails>
          </CardBodyContentEnd>
        </CardBodyContent>
      </CardBody>
    </Card>
  );
};
