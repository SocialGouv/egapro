/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import InformationsEntreprisePage from "../page";

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
  entreprise?: DeclarationDTO["entreprise"] & {
    entrepriseDéclarante?: {
      adresse: string;
      codeNaf: string;
      codePays: string;
      codePostal: string;
      commune: string;
      raisonSociale: string;
      siren: string;
    };
  };
  ues?: DeclarationDTO["ues"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
  savePageData: (page: keyof DeclarationDTO, data: DeclarationDTO[keyof DeclarationDTO] | undefined) => void;
}

const renderWithProviders = (ui: React.ReactElement) => {
  // @ts-ignore
  return render(<SessionProvider session={{ user: { email: "test@test.com" }, expires: "1" }}>{ui}</SessionProvider>);
};

describe("InformationsEntreprisePage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
      },
      entreprise: {
        entrepriseDéclarante: {
          raisonSociale: "Test Company",
          siren: "123456789",
          codeNaf: "12.00Z",
          codePays: "FR",
          adresse: "1 rue du Test",
          commune: "Paris",
          codePostal: "75001",
        },
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

  describe("Page Display", () => {
    it("should show company information", () => {
      renderWithProviders(<InformationsEntreprisePage />);
      expect(screen.getByText("Test Company")).toBeInTheDocument();
    });

    it("should show info alert about workforce", () => {
      renderWithProviders(<InformationsEntreprisePage />);

      expect(screen.getByText(/Concernant la tranche d'effectifs assujettis/)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should handle entreprise form submission", async () => {
      renderWithProviders(<InformationsEntreprisePage />);

      const entrepriseRadio = screen.getByLabelText(/Entreprise/);
      fireEvent.click(entrepriseRadio);

      const trancheRadio = screen.getByLabelText(/50 à 250/);
      fireEvent.click(trancheRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          entreprise: {
            ...mockFormManager.formData.entreprise,
            type: "entreprise",
            tranche: "50:250",
          },
          ues: undefined,
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle UES form submission", async () => {
      renderWithProviders(<InformationsEntreprisePage />);

      const uesRadio = screen.getByLabelText(/Unité Économique et Sociale/);
      fireEvent.click(uesRadio);

      const trancheRadio = screen.getByLabelText(/50 à 250/);
      fireEvent.click(trancheRadio);

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          entreprise: {
            ...mockFormManager.formData.entreprise,
            type: "ues",
            tranche: "50:250",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
