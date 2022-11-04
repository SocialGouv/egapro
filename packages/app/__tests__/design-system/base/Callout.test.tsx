import { render } from "@testing-library/react";
import { Callout, CalloutButton, CalloutContent, CalloutTitle } from "@design-system";

test("should match snapshot", () => {
  const mockClick = jest.fn();
  const view = render(
    <Callout icon="fr-fi-information-line">
      <CalloutTitle>Titre mise en avant</CalloutTitle>
      <CalloutContent>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </CalloutContent>
      <CalloutButton onClick={mockClick}>Cliquer là</CalloutButton>
    </Callout>,
  );
  expect(view).toMatchSnapshot();
});
