/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import HautesRemunerationsPage from "../page";

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
  "hautes-remunerations"?: {
    note?: number;
    populationFavorable?: "femmes" | "hommes";
    résultat?: number;
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("HautesRemunerationsPage", () => {
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
    it("should show result field", () => {
      render(<HautesRemunerationsPage />);

      expect(
        screen.getByLabelText(/Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/),
      ).toBeInTheDocument();
    });

    it("should show population favorable when result is not 5", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "3" } });

      await waitFor(() => {
        expect(screen.getByText(/Sexe des salariés sur-représentés/)).toBeInTheDocument();
      });
    });

    it("should not show population favorable when result is 5", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await waitFor(() => {
        expect(screen.queryByText(/Sexe des salariés sur-représentés/)).not.toBeInTheDocument();
      });
    });

    it("should show note when result is entered", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await waitFor(() => {
        expect(screen.getByText(/Nombre de points obtenus à l'indicateur/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should validate result range", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "6" } });

      await waitFor(() => {
        expect(screen.getByText(/ne peut pas être supérieur à 5/)).toBeInTheDocument();
      });

      fireEvent.change(resultatInput, { target: { value: "-1" } });

      await waitFor(() => {
        expect(screen.getByText(/ne peut pas être inférieur à 0/)).toBeInTheDocument();
      });

      fireEvent.change(resultatInput, { target: { value: "2.5" } });

      await waitFor(() => {
        expect(screen.getByText(/La valeur doit être un nombre entier/)).toBeInTheDocument();
      });
    });

    it("should require population favorable when result is not 5", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "3" } });

      const submitButton = screen.getByText("Suivant");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("La population favorable est obligatoire")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with result 5", async () => {
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

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
      render(<HautesRemunerationsPage />);

      const resultatInput = screen.getByLabelText(
        /Résultat obtenu à l'indicateur en nombre de salariés du sexe sous-représenté/,
      );
      fireEvent.change(resultatInput, { target: { value: "3" } });

      const hommesRadio = screen.getByLabelText(/Hommes/);
      fireEvent.click(hommesRadio);

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "hautes-remunerations": {
            résultat: 3,
            populationFavorable: "hommes",
            note: expect.any(Number),
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
