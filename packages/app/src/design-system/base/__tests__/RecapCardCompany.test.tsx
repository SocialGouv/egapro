import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { RecapCardCompany } from "../RecapCardCompany";

// Mock des dépendances externes
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: { user: { staff: true } } })),
}));

// Mock du portail client pour éviter les erreurs de rendu
vi.mock("@components/utils/ClientBodyPortal", () => ({
  ClientBodyPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock des modales
vi.mock("@codegouvfr/react-dsfr/Modal", () => ({
  createModal: () => ({
    Component: ({ children }: { children: React.ReactNode }) => <div data-testid="modal">{children}</div>,
    buttonProps: {},
    close: vi.fn(),
  }),
}));

describe("RecapCardCompany", () => {
  // Données de test pour une entreprise française
  const frenchCompany: CompanyDTO = {
    name: "Entreprise Française",
    siren: "123456789",
    nafCode: "62.01Z",
    countryIsoCode: "FR",
    address: "1 rue de la Paix",
    city: "Paris",
    postalCode: "75001",
    county: "75",
    region: "11",
    workforce: {
      range: CompanyWorkforceRange.Enum.FROM_50_TO_250,
    },
  };

  // Données de test pour une entreprise étrangère
  const foreignCompany: CompanyDTO = {
    name: "Foreign Company",
    siren: "987654321",
    nafCode: "62.01Z",
    countryIsoCode: "US",
    address: "",
    city: "",
    postalCode: "",
    county: undefined,
    region: undefined,
    workforce: {
      range: CompanyWorkforceRange.Enum.FROM_50_TO_250,
    },
  };

  // Fonction de soumission mock
  const mockOnSubmit = vi.fn();

  describe("Mode d'affichage (view)", () => {
    it("devrait afficher les informations d'adresse pour une entreprise française", () => {
      render(<RecapCardCompany company={frenchCompany} mode="view" />);

      // Vérifier que les informations d'adresse sont affichées
      expect(screen.getByText(/1 rue de la Paix/i)).toBeInTheDocument();
      expect(screen.getByText(/75001/i)).toBeInTheDocument();
      expect(screen.getByText(/Département : Paris/i)).toBeInTheDocument();
      expect(screen.getByText(/Région : Île-de-France/i)).toBeInTheDocument();

      // Vérifier que le pays n'est pas affiché (car c'est la France)
      expect(screen.queryByText(/Pays :/i)).not.toBeInTheDocument();
    });

    it("ne devrait pas afficher les informations d'adresse pour une entreprise étrangère", () => {
      render(<RecapCardCompany company={foreignCompany} mode="view" />);

      // Vérifier que les informations d'adresse ne sont pas affichées
      expect(screen.queryByText(/rue/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Département :/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Région :/i)).not.toBeInTheDocument();

      // Vérifier que le pays est affiché
      expect(screen.getByText(/Pays : ETATS-UNIS/i)).toBeInTheDocument();
    });
  });

  describe("Mode d'édition (formulaire)", () => {
    it("devrait afficher les champs d'adresse dans le formulaire pour une entreprise française", () => {
      render(<RecapCardCompany company={frenchCompany} mode="admin" onSubmit={mockOnSubmit} />);

      // Ouvrir le modal d'édition
      fireEvent.click(screen.getByTitle("Informations de l'entreprise déclarante"));

      // Vérifier que les champs d'adresse sont présents
      expect(screen.getByLabelText(/Adresse \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ville \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Code postal \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Département \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Région \*/i)).toBeInTheDocument();
    });

    it("ne devrait pas afficher les champs d'adresse dans le formulaire pour une entreprise étrangère", () => {
      render(<RecapCardCompany company={foreignCompany} mode="admin" onSubmit={mockOnSubmit} />);

      // Ouvrir le modal d'édition
      fireEvent.click(screen.getByTitle("Informations de l'entreprise déclarante"));

      // Vérifier que les champs d'adresse ne sont pas présents
      expect(screen.queryByLabelText(/Adresse \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Ville \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Code postal \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Département \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Région \*/i)).not.toBeInTheDocument();
    });

    it("devrait masquer les champs d'adresse lorsque le pays est changé de France à un pays étranger", () => {
      render(<RecapCardCompany company={frenchCompany} mode="admin" onSubmit={mockOnSubmit} />);

      // Ouvrir le modal d'édition
      fireEvent.click(screen.getByTitle("Informations de l'entreprise déclarante"));

      // Vérifier que les champs d'adresse sont initialement présents
      expect(screen.getByLabelText(/Adresse \*/i)).toBeInTheDocument();

      // Changer le pays pour un pays étranger
      fireEvent.change(screen.getByLabelText(/Pays \*/i), { target: { value: "US" } });

      // Vérifier que les champs d'adresse ne sont plus présents
      expect(screen.queryByLabelText(/Adresse \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Ville \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Code postal \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Département \*/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Région \*/i)).not.toBeInTheDocument();
    });

    it("devrait afficher les champs d'adresse lorsque le pays est changé d'un pays étranger à la France", () => {
      render(<RecapCardCompany company={foreignCompany} mode="admin" onSubmit={mockOnSubmit} />);

      // Ouvrir le modal d'édition
      fireEvent.click(screen.getByTitle("Informations de l'entreprise déclarante"));

      // Vérifier que les champs d'adresse ne sont initialement pas présents
      expect(screen.queryByLabelText(/Adresse \*/i)).not.toBeInTheDocument();

      // Changer le pays pour la France
      fireEvent.change(screen.getByLabelText(/Pays \*/i), { target: { value: "FR" } });

      // Vérifier que les champs d'adresse sont maintenant présents
      expect(screen.getByLabelText(/Adresse \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ville \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Code postal \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Département \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Région \*/i)).toBeInTheDocument();
    });
  });
});
