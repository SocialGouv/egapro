import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

import InformationsEntreprisePage from "../page";

// Mock external components and hooks
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

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
  };
  "periode-reference"?: DeclarationDTO["periode-reference"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
}

describe("InformationsEntreprisePage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
      },
      "periode-reference": undefined,
    },
    saveFormData: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Integration", () => {
    it("should render all components in correct order", () => {
      render(<InformationsEntreprisePage />);

      const elements = screen.getAllByTestId(/alert-existing|stepper/);
      expect(elements[0]).toHaveAttribute("data-testid", "alert-existing");
      expect(elements[1]).toHaveAttribute("data-testid", "stepper");
    });

    it("should pass correct stepName to stepper", () => {
      render(<InformationsEntreprisePage />);

      expect(screen.getByTestId("stepper")).toHaveTextContent("periode-reference");
    });
  });

  describe("Form Integration", () => {
    it("should show date and effectif fields when 'Oui' is selected", async () => {
      render(<InformationsEntreprisePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/Date de fin de la période de référence/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre de salariés/i)).toBeInTheDocument();
      });
    });

    it("should hide date and effectif fields when 'Non' is selected", async () => {
      render(<InformationsEntreprisePage />);

      const nonRadio = screen.getByLabelText(/Non/i);
      fireEvent.click(nonRadio);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Date de fin de la période de référence/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Nombre de salariés/i)).not.toBeInTheDocument();
      });
    });

    it("should handle complete form submission", async () => {
      render(<InformationsEntreprisePage />);

      const ouiRadio = screen.getByLabelText(/Oui/i);
      fireEvent.click(ouiRadio);

      const dateInput = screen.getByLabelText(/Date de fin de la période de référence/i);
      fireEvent.change(dateInput, { target: { value: "2024-12-31" } });

      const effectifInput = screen.getByLabelText(/Nombre de salariés/i);
      fireEvent.change(effectifInput, { target: { value: "100" } });

      const form = screen.getByRole("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            "periode-reference": {
              périodeSuffisante: "oui",
              finPériodeRéférence: "2024-12-31",
              effectifTotal: 100,
            },
          }),
        );
      });
    });
  });
});
