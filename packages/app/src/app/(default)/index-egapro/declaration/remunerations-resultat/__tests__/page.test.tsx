import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

import RemunerationResultatPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

jest.mock("../../AlertExistingDeclaration", () => ({
  AlertExistingDeclaration: () => <div data-testid="alert-existing">Alert Existing</div>,
}));

jest.mock("../../DeclarationStepper", () => ({
  DeclarationStepper: ({ stepName }: { stepName: string }) => <div data-testid="stepper">{stepName}</div>,
}));

// Mock ClientOnly to render children directly
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
  };
  "remunerations-resultat"?: DeclarationDTO["remunerations-resultat"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("RemunerationResultatPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
      },
      "remunerations-resultat": undefined,
    },
    saveFormData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Structure", () => {
    it("should render all components in correct order", () => {
      render(<RemunerationResultatPage />);

      const elements = screen.getAllByTestId(/alert-existing|stepper/);
      expect(elements[0]).toHaveAttribute("data-testid", "alert-existing");
      expect(elements[1]).toHaveAttribute("data-testid", "stepper");
    });

    it("should pass correct stepName to stepper", () => {
      render(<RemunerationResultatPage />);

      expect(screen.getByTestId("stepper")).toHaveTextContent("remunerations-resultat");
    });
  });

  describe("Form Validation", () => {
    it("should disable Suivant button when form is empty", () => {
      render(<RemunerationResultatPage />);

      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeDisabled();
    });

    it("should show error when résultat is not a valid percentage", async () => {
      render(<RemunerationResultatPage />);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "abc" } });

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeDisabled();
      });
    });

    it("should require populationFavorable when résultat is not 0", async () => {
      render(<RemunerationResultatPage />);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "5" } });

      await waitFor(() => {
        expect(
          screen.getByText("Population envers laquelle l'écart est favorable", { exact: false }),
        ).toBeInTheDocument();
        expect(screen.getByText("Suivant")).toBeDisabled();
      });
    });

    it("should not require populationFavorable when résultat is 0", async () => {
      render(<RemunerationResultatPage />);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "0" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Population envers laquelle l'écart est favorable", { exact: false }),
        ).not.toBeInTheDocument();
        expect(screen.getByText("Suivant")).toBeEnabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle valid form submission with résultat 0", async () => {
      render(<RemunerationResultatPage />);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeEnabled();
      });

      const suivantButton = screen.getByText("Suivant");
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            "remunerations-resultat": {
              résultat: 0,
              note: expect.any(Number),
            },
          }),
        );
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle valid form submission with non-zero résultat", async () => {
      render(<RemunerationResultatPage />);

      const resultatInput = screen.getByLabelText(/Résultat final obtenu/);
      fireEvent.change(resultatInput, { target: { value: "5" } });

      // Wait for populationFavorable to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Population envers laquelle/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Femmes"));

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeEnabled();
      });

      const suivantButton = screen.getByText("Suivant");
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            "remunerations-resultat": {
              résultat: 5,
              populationFavorable: "femmes",
              note: expect.any(Number),
            },
          }),
        );
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
