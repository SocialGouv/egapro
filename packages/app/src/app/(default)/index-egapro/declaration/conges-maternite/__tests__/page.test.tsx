/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
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
  "conges-maternite"?: DeclarationDTO["conges-maternite"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
  savePageData: (page: keyof DeclarationDTO, data: DeclarationDTO[keyof DeclarationDTO] | undefined) => void;
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
    savePageData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Form Display", () => {
    it("should show non calculable fields when Non is selected", async () => {
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Motif de non calculabilité/)).toBeInTheDocument();
      });
    });

    it("should show calculable fields when Oui is selected", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Résultat final obtenu/)).toBeInTheDocument();
      });
    });

    it("should show note when valid result is entered", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "80" } });

      await waitFor(() => {
        expect(screen.getByText(/Nombre de points obtenus/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require motif when non calculable", async () => {
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle non calculable form submission", async () => {
      render(<CongesMaterniteForm />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const motifSelect = screen.getByLabelText(/Motif de non calculabilité/);
      fireEvent.change(motifSelect, { target: { value: "absrcm" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

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

    it("should handle calculable form submission", async () => {
      render(<CongesMaterniteForm />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "80" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

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
