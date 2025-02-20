/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import PublicationPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
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
    type: "entreprise" | "ues";
  };
  "periode-reference"?: {
    finPériodeRéférence: string;
    périodeSuffisante: "non" | "oui";
  };
  publication?: {
    choixSiteWeb: "non" | "oui";
    date: string;
    modalités?: string;
    planRelance?: "non" | "oui";
    url?: string;
  };
  "resultat-global"?: {
    index: number;
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("PublicationPage", () => {
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
        type: "entreprise",
      },
      "periode-reference": {
        périodeSuffisante: "oui",
        finPériodeRéférence: "2024-12-31",
      },
      "resultat-global": {
        index: 85,
      },
    },
    saveFormData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Display", () => {
    it("should show explanation text", () => {
      render(<PublicationPage />);

      expect(screen.getByText(/La note obtenue à l’index/)).toBeInTheDocument();
      expect(screen.getByText(/publiés de manière visible et lisible/)).toBeInTheDocument();
    });

    it("should show url field when website is yes", async () => {
      render(<PublicationPage />);

      const ouiRadio = screen.getAllByLabelText(/Oui/i)[0];
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Indiquer l'adresse exacte/)).toBeInTheDocument();
      });
    });

    it("should show modalités field when website is no", async () => {
      render(<PublicationPage />);

      const nonRadio = screen.getAllByLabelText(/Non/i)[0];
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Préciser les modalités/)).toBeInTheDocument();
      });
    });

    it("should show plan relance question for year > 2020", () => {
      render(<PublicationPage />);

      expect(screen.getByText(/Avez-vous bénéficié, depuis 2021/)).toBeInTheDocument();
    });

    it("should not show plan relance question for year <= 2020", () => {
      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          commencer: {
            ...mockFormManager.formData.commencer,
            annéeIndicateurs: 2020,
          },
        },
      });

      render(<PublicationPage />);

      expect(screen.queryByText(/Avez-vous bénéficié, depuis 2021/)).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should validate url format", async () => {
      render(<PublicationPage />);

      const ouiRadio = screen.getAllByLabelText(/Oui/i)[0];
      fireEvent.click(ouiRadio);

      const urlInput = screen.getByLabelText(/Indiquer l'adresse exacte/);
      fireEvent.change(urlInput, { target: { value: "invalid-url" } });

      await waitFor(() => {
        expect(screen.getByText(/L'adresse de la page internet est invalide/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with website", async () => {
      render(<PublicationPage />);

      const dateInput = screen.getByLabelText(/Date de publication/);
      fireEvent.change(dateInput, { target: { value: "2025-01-01" } });

      const ouiRadio = screen.getAllByLabelText(/Oui/i)[0];
      fireEvent.click(ouiRadio);

      const urlInput = screen.getByLabelText(/Indiquer l'adresse exacte/);
      fireEvent.change(urlInput, { target: { value: "https://example.com" } });

      const planRelanceRadio = screen.getByLabelText(/Non/i, { selector: 'input[name="planRelance"]' });
      fireEvent.click(planRelanceRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          publication: {
            choixSiteWeb: "oui",
            date: "2025-01-01",
            url: "https://example.com",
            planRelance: "non",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle form submission without website", async () => {
      render(<PublicationPage />);

      const dateInput = screen.getByLabelText(/Date de publication/);
      fireEvent.change(dateInput, { target: { value: "2025-01-01" } });

      const nonRadio = screen.getAllByLabelText(/Non/i)[0];
      fireEvent.click(nonRadio);

      const modalitesInput = screen.getByLabelText(/Préciser les modalités/);
      fireEvent.change(modalitesInput, { target: { value: "Affichage dans les locaux" } });

      const planRelanceRadio = screen.getByLabelText(/Non/i, { selector: 'input[name="planRelance"]' });      fireEvent.click(planRelanceRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          publication: {
            choixSiteWeb: "non",
            date: "2025-01-01",
            modalités: "Affichage dans les locaux",
            planRelance: "non",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
