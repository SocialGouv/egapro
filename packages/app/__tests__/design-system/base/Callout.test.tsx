import { render } from "@testing-library/react";
import { Callout } from "@/design-system/base/Callout";

test("should match snapshot", () => {
  const mockClick = jest.fn();
  const view = render(
    <Callout icon="fr-fi-information-line">
      <Callout.Title>Titre mise en avant</Callout.Title>
      <Callout.Content>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </Callout.Content>
      <Callout.Button onClick={mockClick}>Cliquer là</Callout.Button>
    </Callout>,
  );
  expect(view).toMatchSnapshot();
});
