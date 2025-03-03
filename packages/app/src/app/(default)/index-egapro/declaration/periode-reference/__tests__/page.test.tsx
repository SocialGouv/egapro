/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import PeriodeReferencePage from "../page";

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
  "periode-reference"?: {
    effectifTotal?: number;
    finPériodeRéférence?: string;
    périodeSuffisante: "non" | "oui";
  };
  remunerations?: {
    estCalculable: "non" | "oui";
  };
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("PeriodeReferencePage", () => {
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

  describe("Form Display", () => {
    it("should show year in highlight", () => {
      render(<PeriodeReferencePage />);

      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText(/est l'année au titre de laquelle/)).toBeInTheDocument();
    });

    it("should show date and effectif fields when Oui is selected", async () => {
      render(<PeriodeReferencePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Date de fin de la période/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre de salariés/)).toBeInTheDocument();
      });
    });

    it("should not show fields when Non is selected", async () => {
      render(<PeriodeReferencePage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        const suivantButton = screen.getByText("Suivant");
        expect(suivantButton).toBeDisabled();
        expect(screen.queryByLabelText(/Date de fin de la période/)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Nombre de salariés/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require date and effectif when Oui is selected", async () => {
      render(<PeriodeReferencePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with Oui", async () => {
      render(<PeriodeReferencePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const dateInput = screen.getByLabelText(/Date de fin de la période/);
      fireEvent.change(dateInput, { target: { value: "2024-12-31" } });

      const effectifInput = screen.getByLabelText(/Nombre de salariés/);
      fireEvent.change(effectifInput, { target: { value: "100" } });

      const suivantButton = screen.getByText("Suivant");
      await wait();
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "periode-reference": {
            périodeSuffisante: "oui",
            finPériodeRéférence: "2024-12-31",
            effectifTotal: 100,
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it("should handle select end of year button", async () => {
      render(<PeriodeReferencePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const selectEndButton = screen.getByRole("button", { name: /Sélectionner la fin de l'année civile/i });
      fireEvent.click(selectEndButton);

      const dateInput = screen.getByLabelText(/Date de fin de la période/);
      expect(dateInput).toHaveValue("2024-12-31");
    });
  });
});
