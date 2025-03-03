/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import PromotionsPage from "../page";

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
  };
  promotions?: {
    catégories?: {
      [CSP.Enum.OUVRIERS]: number | string;
      [CSP.Enum.EMPLOYES]: number | string;
      [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: number | string;
      [CSP.Enum.INGENIEURS_CADRES]: number | string;
    };
    estCalculable: "non" | "oui";
    motifNonCalculabilité?: string;
    note?: number;
    populationFavorable?: "femmes" | "hommes";
    résultat?: number | string;
  };
  "remunerations-resultat"?: {
    populationFavorable?: "femmes" | "hommes";
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("PromotionsPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
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
    it("should show motif field when not calculable", async () => {
      render(<PromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Motif de non calculabilité de l'indicateur/)).toBeInTheDocument();
      });
    });

    it("should show CSP fields when calculable", async () => {
      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Ouvriers/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Employés/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Techniciens et agents de maîtrise/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Ingénieurs et cadres/)).toBeInTheDocument();
      });
    });

    it("should show population favorable when result is not 0", async () => {
      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const ouvriersInput = screen.getByLabelText(/Ouvriers/);
      fireEvent.change(ouvriersInput, { target: { value: "1.5" } });

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      await waitFor(() => {
        expect(screen.getByText(/Population envers laquelle l'écart est favorable/)).toBeInTheDocument();
      });
    });

    it("should show rattrapage message when population favorable changes", async () => {
      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "remunerations-resultat": {
            populationFavorable: "femmes",
          },
        },
      });

      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const ouvriersInput = screen.getByLabelText(/Ouvriers/);
      fireEvent.change(ouvriersInput, { target: { value: "1.5" } });

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const hommesRadio = screen.getByLabelText(/Hommes/);
      fireEvent.click(hommesRadio);

      await waitFor(() => {
        expect(screen.getByText(/L’écart constaté étant en faveur du sexe le moins bien rémunéré/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require motif when not calculable", async () => {
      render(<PromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });

    it("should require at least one CSP when calculable", async () => {
      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });

    it("should require population favorable when result is not 0", async () => {
      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const ouvriersInput = screen.getByLabelText(/Ouvriers/);
      fireEvent.change(ouvriersInput, { target: { value: "1.5" } });

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with non calculable", async () => {
      render(<PromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const motifInput = screen.getByLabelText(/Motif de non calculabilité de l'indicateur/);
      fireEvent.change(motifInput, { target: { value: "absprom" } });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          promotions: {
            estCalculable: "non",
            motifNonCalculabilité: "absprom",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle form submission with calculable", async () => {
      render(<PromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const ouvriersInput = screen.getByLabelText(/Ouvriers/);
      fireEvent.change(ouvriersInput, { target: { value: "1.5" } });

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const hommesRadio = screen.getByLabelText(/Hommes/);
      fireEvent.click(hommesRadio);

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          promotions: {
            estCalculable: "oui",
            catégories: {
              [CSP.Enum.OUVRIERS]: 1.5,
            },
            résultat: 1.5,
            populationFavorable: "hommes",
            note: expect.any(Number),
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
