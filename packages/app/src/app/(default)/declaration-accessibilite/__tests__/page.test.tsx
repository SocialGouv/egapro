import { render } from "@testing-library/react";

import AccessibilityStatement from "../page";

/**
 * Test de la page de déclaration d'accessibilité
 *
 * Cette page étant statique, nous utilisons principalement des snapshots
 * pour vérifier son contenu, ce qui est plus approprié pour un contenu
 * statique et permet de détecter tout changement non intentionnel.
 */
describe("<AccessibilityStatement />", () => {
  it("devrait correspondre au snapshot", () => {
    // Capture de l'ensemble du contenu de la page
    const { container } = render(<AccessibilityStatement />);
    expect(container).toMatchSnapshot();
  });

  // Test spécifique pour l'élément le plus important (le titre)
  it("devrait afficher le titre de la page correctement", () => {
    const { getByRole } = render(<AccessibilityStatement />);
    const title = getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Déclaration d'accessibilité");
  });
});
