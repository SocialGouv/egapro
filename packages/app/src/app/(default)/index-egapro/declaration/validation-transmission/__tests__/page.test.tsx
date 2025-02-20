/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

import { saveDeclaration } from "../../actions";
import ValidationTransmissionPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: "test@test.com" } },
    status: "authenticated",
  })),
}));

// Mock actions
jest.mock("../../actions", () => ({
  saveDeclaration: jest.fn(),
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

type RecapDeclarationProps = {
  déclaration: {
    entreprise?: {
      entrepriseDéclarante?: {
        raisonSociale: string;
      };
    };
  };
};

jest.mock("../../[siren]/[year]/RecapDeclaration", () => ({
  RecapDeclaration: ({ déclaration }: RecapDeclarationProps) => (
    <div data-testid="recap">Récapitulatif pour {déclaration.entreprise?.entrepriseDéclarante?.raisonSociale}</div>
  ),
}));

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
  };
  entreprise?: {
    entrepriseDéclarante?: {
      raisonSociale: string;
    };
  };
};

interface FormManagerType {
  formData: FormData;
  setStatus: (status: string) => void;
}

describe("ValidationTransmissionPage", () => {
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
        },
      },
    },
    setStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Display", () => {
    it("should show explanation text", () => {
      render(<ValidationTransmissionPage />);

      expect(screen.getByText(/Vous êtes sur le point de valider/)).toBeInTheDocument();
      expect(screen.getByText(/Pour terminer la procédure/)).toBeInTheDocument();
    });

    it("should show declaration recap", () => {
      render(<ValidationTransmissionPage />);

      expect(screen.getByTestId("recap")).toHaveTextContent("Récapitulatif pour Test Company");
    });
  });

  describe("Form Submission", () => {
    it("should handle successful submission", async () => {
      (saveDeclaration as jest.Mock).mockResolvedValue({ ok: true });

      render(<ValidationTransmissionPage />);

      const submitButton = screen.getByRole("button", { name: "Valider et transmettre les résultats" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(saveDeclaration).toHaveBeenCalledWith(mockFormManager.formData);
        expect(mockFormManager.setStatus).toHaveBeenCalledWith("edition");
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle failed submission", async () => {
      (saveDeclaration as jest.Mock).mockResolvedValue({ ok: false, error: "Une erreur est survenue" });

      render(<ValidationTransmissionPage />);

      const submitButton = screen.getByRole("button", { name: "Valider et transmettre les résultats" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(saveDeclaration).toHaveBeenCalledWith(mockFormManager.formData);
        expect(screen.getByText("Une erreur est survenue")).toBeInTheDocument();
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it("should handle back button", () => {
      render(<ValidationTransmissionPage />);

      const backButton = screen.getByText("Précédent");
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalled();
    });
  });
});
