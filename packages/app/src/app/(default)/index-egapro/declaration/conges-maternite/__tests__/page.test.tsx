/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import CongesMaterniteForm from "../page";

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
  "conges-maternite"?: {
    estCalculable: "non" | "oui";
    motifNonCalculabilité?: string;
    note?: number;
    résultat?: number | string;
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("CongesMaterniteForm", () => {
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
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Motif de non calculabilité de l'indicateur/)).toBeInTheDocument();
      });
    });

    it("should show result field when calculable", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Résultat final obtenu à l'indicateur en %/)).toBeInTheDocument();
      });
    });

    it("should show note when result is entered", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "80" } });

      await waitFor(() => {
        expect(screen.getByText(/Nombre de points obtenus à l'indicateur/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require motif when not calculable", async () => {
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();
    });

    it("should validate result range when calculable", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "150" } });

      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeDisabled();

      fireEvent.change(resultatInput, { target: { value: "-10" } });

      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with non calculable", async () => {
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const motifInput = screen.getByLabelText(/Motif de non calculabilité de l'indicateur/);
      fireEvent.change(motifInput, { target: { value: "absrcm" } });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "conges-maternite": {
            estCalculable: "non",
            motifNonCalculabilité: "absrcm",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle form submission with calculable", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final/);
      fireEvent.change(resultatInput, { target: { value: "80" } });

      await wait();
      const submitButton = screen.getByText("Suivant");
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "conges-maternite": {
            estCalculable: "oui",
            résultat: 80,
            note: expect.any(Number),
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
