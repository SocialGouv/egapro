/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import RemunerationPage from "../page";

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
  remunerations?: DeclarationDTO["remunerations"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
  savePageData: (page: keyof DeclarationDTO, data: DeclarationDTO[keyof DeclarationDTO] | undefined) => void;
}

describe("RemunerationPage", () => {
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
      render(<RemunerationPage />);

      const nonRadio = screen.getByLabelText(/non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.getByText(/Je déclare avoir procédé au calcul/)).toBeInTheDocument();
      });
    });

    it("should show calculable fields when Oui is selected", async () => {
      render(<RemunerationPage />);

      const ouiRadio = screen.getByLabelText(/oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByText(/Modalité choisie pour le calcul/)).toBeInTheDocument();
      });
    });

    it("should show CSE fields when niveau_branche is selected", async () => {
      render(<RemunerationPage />);

      const ouiRadio = screen.getByLabelText(/oui/i);
      fireEvent.click(ouiRadio);

      const niveauBrancheRadio = screen.getByLabelText(/classification de branche/i);
      fireEvent.click(niveauBrancheRadio);

      await waitFor(() => {
        expect(screen.getByText(/Un CSE a-t-il été mis en place/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle non calculable form submission", async () => {
      render(<RemunerationPage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      const declarationCheckbox = screen.getByLabelText(/Je déclare avoir procédé au calcul/);
      fireEvent.click(declarationCheckbox);

      const motifSelect = screen.getByLabelText(/Motif de non calculabilité de l'indicateur/);
      fireEvent.change(motifSelect, { target: { value: "egvi40pcet" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          remunerations: {
            estCalculable: "non",
            déclarationCalculCSP: true,
            motifNonCalculabilité: "egvi40pcet",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle calculable form submission with CSP", async () => {
      render(<RemunerationPage />);

      const ouiRadio = screen.getByLabelText(/oui/i);
      fireEvent.click(ouiRadio);

      const cspRadio = screen.getByLabelText(/Par catégorie socio-professionnelle/);
      fireEvent.click(cspRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          remunerations: {
            estCalculable: "oui",
            mode: "csp",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle calculable form submission with niveau_branche and CSE", async () => {
      render(<RemunerationPage />);

      const ouiRadio = screen.getAllByLabelText(/oui/i)[0];
      fireEvent.click(ouiRadio);

      const niveauBrancheRadio = screen.getByLabelText(/classification de branche/);
      fireEvent.click(niveauBrancheRadio);

      const cseOuiRadio = screen.getAllByLabelText(/Oui/i)[1];
      fireEvent.click(cseOuiRadio);

      const dateInput = screen.getByLabelText(/Date de consultation/);
      fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          remunerations: {
            estCalculable: "oui",
            mode: "niveau_branche",
            cse: "oui",
            dateConsultationCSE: "2024-01-01",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
