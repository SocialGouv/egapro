/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
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

// Mock ClientOnly to render children directly
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useHasMounted: jest.fn(() => true),
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
  "hautes-remunerations"?: DeclarationDTO["hautes-remunerations"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
  savePageData: (page: keyof DeclarationDTO, data: DeclarationDTO[keyof DeclarationDTO] | undefined) => void;
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
    savePageData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Form Display", () => {
    it("should show population favorable field when result is not 5", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "4" } });

      await waitFor(() => {
        expect(screen.getByText(/Sexe des salariés sur-représentés/)).toBeInTheDocument();
      });
    });

    it("should not show population favorable field when result is 5", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await waitFor(() => {
        expect(screen.queryByText(/Sexe des salariés sur-représentés/)).not.toBeInTheDocument();
      });
    });

    it("should show note when valid result is entered", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await waitFor(() => {
        expect(screen.getByText(/Nombre de points obtenus/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require population favorable when result is not 5", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "4" } });

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with result 5", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "hautes-remunerations": {
            résultat: 5,
            note: expect.any(Number),
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle form submission with result not 5", async () => {
      render(<AugmentationEtPromotionsPage />);

      const resultatInput = screen.getByLabelText(/Résultat obtenu/);
      fireEvent.change(resultatInput, { target: { value: "4" } });

      const populationFavorableRadio = screen.getByLabelText(/Femmes/);
      fireEvent.click(populationFavorableRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "hautes-remunerations": {
            résultat: 4,
            populationFavorable: "femmes",
            note: expect.any(Number),
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
