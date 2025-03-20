import { render, screen } from "@testing-library/react";

import Cgu from "../page";

describe("<Cgu />", () => {
  it("should render the page title", () => {
    render(<Cgu />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/Conditions générales d’utilisation/);
  });

  it("should render the description", () => {
    render(<Cgu />);

    const description = screen.getByText(/Les présentes conditions générales/);
    expect(description).toBeInTheDocument();
  });

  it("should render the article sections", () => {
    render(<Cgu />);

    const article1 = screen.getByText(/Article 1 - Champ d’application/);
    expect(article1).toBeInTheDocument();

    const article2 = screen.getByText(/Article 2 - Objet/);
    expect(article2).toBeInTheDocument();

    const article3 = screen.getByText(/Article 3 - Fonctionnalités/);
    expect(article3).toBeInTheDocument();

    const article4 = screen.getByText(/Article 4 - Responsabilités/);
    expect(article4).toBeInTheDocument();

    const article5 = screen.getByText(/Article 5 - Mise à jour/);
    expect(article5).toBeInTheDocument();
  });

  it("should render the sub-sections", () => {
    render(<Cgu />);

    const section31 = screen.getByText(/3.1 Egapro sur l’index/);
    expect(section31).toBeInTheDocument();

    const section32 = screen.getByText(/3.2 Egapro sur la représentation/);
    expect(section32).toBeInTheDocument();

    const section41 = screen.getByText(/4.1 L’Éditeur de la Plateforme/);
    expect(section41).toBeInTheDocument();

    const section42 = screen.getByText(/4.2 L’Utilisateur/);
    expect(section42).toBeInTheDocument();
  });
});
