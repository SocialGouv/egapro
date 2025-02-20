/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import * as companyActions from "@globalActions/company";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";
import { isValid } from "@common/utils/luhn";

import UESPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

// Mock actions
jest.mock("@globalActions/company", () => ({
  getCompany: jest.fn(),
}));

jest.mock("@common/utils/luhn", () => ({
  isValid: jest.fn(() => true),
}));

// Mock external components
jest.mock("../../AlertExistingDeclaration", () => ({
  AlertExistingDeclaration: () => <div data-testid="alert-existing">Alert Existing</div>,
}));

jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
    siren: string;
  };
  entreprise?: {
    entrepriseDéclarante?: {
      raisonSociale: string;
      siren: string;
    };
  };
  ues?: {
    entreprises: Array<{
      raisonSociale: string;
      siren: string;
    }>;
    nom: string;
  };
};

interface FormManagerType {
  formData: FormData;
  savePageData: (page: keyof FormData, data: FormData[keyof FormData]) => void;
}

const mockEntreprise: Entreprise = {
  activitePrincipaleUniteLegale: "47.11F",
  allMatchingEtablissements: [
    {
      activitePrincipaleEtablissement: "47.11F",
      address: "1 rue du Test",
      codeCommuneEtablissement: "75001",
      codePostalEtablissement: "75001",
      etablissementSiege: true,
      libelleCommuneEtablissement: "PARIS",
      siret: "12345678900001",
    },
  ],
  caractereEmployeurUniteLegale: "O",
  categorieJuridiqueUniteLegale: "5710",
  conventions: [],
  dateCreationUniteLegale: "2020-01-01",
  dateDebut: "2020-01-01",
  etablissements: 1,
  etatAdministratifUniteLegale: "A",
  firstMatchingEtablissement: {
    activitePrincipaleEtablissement: "47.11F",
    address: "1 rue du Test",
    codeCommuneEtablissement: "75001",
    codePostalEtablissement: "75001",
    etablissementSiege: true,
    libelleCommuneEtablissement: "PARIS",
    siret: "12345678900001",
  },
  highlightLabel: "Test Company",
  label: "Test Company",
  matching: 100,
  simpleLabel: "Test Company",
  siren: "123456789",
};

describe("UESPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
        siren: "123456789",
      },
      entreprise: {
        entrepriseDéclarante: {
          raisonSociale: "Entreprise Déclarante",
          siren: "123456789",
        },
      },
    },
    savePageData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Display", () => {
    it("should show declarant company", () => {
      render(<UESPage />);

      expect(screen.getByText("123456789")).toBeInTheDocument();
      expect(screen.getByText("Entreprise Déclarante")).toBeInTheDocument();
      expect(screen.getByText("Entreprise déclarante")).toBeInTheDocument();
    });

    it("should show company count", () => {
      render(<UESPage />);

      expect(screen.getByText("1 entreprise compose l'UES")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should validate UES name", async () => {
      render(<UESPage />);

      const submitButton = screen.getByText("Suivant");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Le nom de l'UES est obligatoire")).toBeInTheDocument();
      });
    });

    it("should validate SIREN format", async () => {
      render(<UESPage />);

      const addButton = screen.getByText("Ajouter une entreprise");
      fireEvent.click(addButton);

      const sirenInput = screen.getByLabelText("Siren entreprise");
      fireEvent.change(sirenInput, { target: { value: "invalid" } });
      fireEvent.blur(sirenInput);

      await waitFor(() => {
        expect(screen.getByText("Le Siren n'est pas valide")).toBeInTheDocument();
      });
    });

    it("should validate duplicate SIREN", async () => {
      (companyActions.getCompany as jest.Mock).mockResolvedValue({
        ok: true,
        data: { ...mockEntreprise, siren: "123456789" },
      });

      render(<UESPage />);

      const addButton = screen.getByText("Ajouter une entreprise");
      fireEvent.click(addButton);

      const sirenInput = screen.getByLabelText("Siren entreprise");
      fireEvent.change(sirenInput, { target: { value: "123456789" } });

      await waitFor(() => {
        expect(companyActions.getCompany).toHaveBeenCalledWith("123456789");
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission", async () => {
      (companyActions.getCompany as jest.Mock).mockResolvedValue({
        ok: true,
        data: { ...mockEntreprise, siren: "987654321" },
      });

      render(<UESPage />);

      const nameInput = screen.getByLabelText(/Nom de l'UES/);
      fireEvent.change(nameInput, { target: { value: "Mon UES" } });

      const addButton = screen.getByText("Ajouter une entreprise");
      fireEvent.click(addButton);

      const sirenInput = screen.getByLabelText("Siren entreprise");
      fireEvent.change(sirenInput, { target: { value: "987654321" } });

      await waitFor(() => {
        expect(companyActions.getCompany).toHaveBeenCalledWith("987654321");
        expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
      });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.savePageData).toHaveBeenCalledWith("ues", {
          nom: "Mon UES",
          entreprises: [
            {
              raisonSociale: "Test Company",
              siren: "987654321",
            },
          ],
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle company removal", async () => {
      (companyActions.getCompany as jest.Mock).mockResolvedValue({
        ok: true,
        data: { ...mockEntreprise, siren: "987654321" },
      });

      render(<UESPage />);

      const addButton = screen.getByText("Ajouter une entreprise");
      fireEvent.click(addButton);

      const sirenInput = screen.getByLabelText("Siren entreprise");
      fireEvent.change(sirenInput, { target: { value: "987654321" } });

      await waitFor(() => {
        expect(companyActions.getCompany).toHaveBeenCalledWith("987654321");
        expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle("Supprimer l'entreprise");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("Test Company")).not.toBeInTheDocument();
        expect(screen.getByText("1 entreprise compose l'UES")).toBeInTheDocument();
      });
    });
  });
});
