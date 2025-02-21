/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import AugmentationEtPromotionsPage from "../page";

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
  "augmentations-et-promotions"?: {
    estCalculable: "non" | "oui";
    motifNonCalculabilité?: string;
    note?: number;
    noteNombreSalaries?: number;
    notePourcentage?: number;
    populationFavorable?: "femmes" | "hommes";
    résultat?: number | string;
    résultatEquivalentSalarié?: number | string;
  };
  commencer?: {
    annéeIndicateurs: number;
  };
  "remunerations-resultat"?: {
    populationFavorable?: "femmes" | "hommes";
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("AugmentationEtPromotionsPage", () => {
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
      render(<AugmentationEtPromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Motif de non calculabilité de l'indicateur/)).toBeInTheDocument();
      });
    });

    it("should show result fields when calculable", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/)).toBeInTheDocument();
      });
    });

    it("should show population favorable when any result is not 0", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      await waitFor(() => {
        expect(screen.getByText(/Population envers laquelle l'écart est favorable/)).toBeInTheDocument();
      });

      fireEvent.change(resultatInput, { target: { value: "0" } });

      const resultatEquivalentInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/);
      fireEvent.change(resultatEquivalentInput, { target: { value: "1.5" } });

      await waitFor(() => {
        expect(screen.getByText(/Population envers laquelle l'écart est favorable/)).toBeInTheDocument();
      });
    });

    it("should show both notes when results are entered", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const resultatEquivalentInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/);
      fireEvent.change(resultatEquivalentInput, { target: { value: "1.5" } });

      await waitFor(() => {
        expect(screen.getByText(/Nombre de points obtenus sur le résultat final en %/)).toBeInTheDocument();
        expect(screen.getByText(/Nombre de points obtenus sur le résultat final en nombre/)).toBeInTheDocument();
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

      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const resultatEquivalentInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/);
      fireEvent.change(resultatEquivalentInput, { target: { value: "1.5" } });

      const hommesRadio = screen.getByLabelText(/Hommes/);
      fireEvent.click(hommesRadio);

      await waitFor(() => {
        expect(screen.getByText(/L’écart constaté étant en faveur du sexe le moins bien rémunéré/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require motif when not calculable", async () => {
      render(<AugmentationEtPromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });

    it("should require both results when calculable", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });

    it("should require population favorable when any result is not 0", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const resultatEquivalentInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/);
      fireEvent.change(resultatEquivalentInput, { target: { value: "0" } });

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with non calculable", async () => {
      render(<AugmentationEtPromotionsPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const motifInput = screen.getByLabelText(/Motif de non calculabilité de l'indicateur/);
      fireEvent.change(motifInput, { target: { value: "absaugi" } });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "augmentations-et-promotions": {
            estCalculable: "non",
            motifNonCalculabilité: "absaugi",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle form submission with calculable", async () => {
      render(<AugmentationEtPromotionsPage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/);
      fireEvent.change(resultatInput, { target: { value: "1.5" } });

      const resultatEquivalentInput = screen.getByLabelText(/Résultat final obtenu à l'indicateur en nombre/);
      fireEvent.change(resultatEquivalentInput, { target: { value: "2.5" } });

      const hommesRadio = screen.getByLabelText(/Hommes/);
      fireEvent.click(hommesRadio);

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "augmentations-et-promotions": {
            estCalculable: "oui",
            résultat: 1.5,
            résultatEquivalentSalarié: 2.5,
            populationFavorable: "hommes",
            note: 35,
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
