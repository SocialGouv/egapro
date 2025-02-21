/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  computeDeclarationIndex,
  DeclarationComputerInputBuilder,
} from "@common/core-domain/computers/DeclarationComputer";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import ResultatGlobalPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

// Mock computeDeclarationIndex and DeclarationComputerInputBuilder
jest.mock("@common/core-domain/computers/DeclarationComputer", () => ({
  computeDeclarationIndex: jest.fn(),
  DeclarationComputerInputBuilder: {
    fromDeclarationDTO: jest.fn(),
  },
}));

// Mock ClientOnly to render children directly
jest.mock("@components/utils/ClientOnly", () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useHasMounted: jest.fn(() => true),
}));

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
  };
  "conges-maternite"?: {
    estCalculable: "non" | "oui";
  };
  "declaration-existante"?: {
    date: string;
  };
  entreprise?: {
    tranche: "50:250" | "251:999" | "1000:";
  };
  "periode-reference"?: {
    effectifTotal: number;
    finPériodeRéférence: string;
    périodeSuffisante: "oui";
  };
  remunerations?: {
    estCalculable: "non" | "oui";
  };
  "remunerations-resultat"?: {
    populationFavorable?: "femmes" | "hommes";
    résultat: number;
  };
  "resultat-global"?: DeclarationDTO["resultat-global"];
};

interface FormManagerType {
  formData: FormData;
  saveFormData: (data: FormData) => void;
  savePageData: (data: FormData) => void;
}

const renderWithProviders = (ui: React.ReactElement) => {
  // @ts-ignore
  return render(<SessionProvider session={{ user: { email: "test@test.com" }, expires: "1" }}>{ui}</SessionProvider>);
};

describe("ResultatGlobalPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
      },
      "resultat-global": undefined,
      "declaration-existante": {
        date: "2024-02-19",
      },
      "periode-reference": {
        périodeSuffisante: "oui",
        finPériodeRéférence: "2024-12-31",
        effectifTotal: 100,
      },
      entreprise: {
        tranche: "50:250",
      },
      remunerations: {
        estCalculable: "oui",
      },
      "remunerations-resultat": {
        résultat: 5,
        populationFavorable: "hommes",
      },
      "conges-maternite": {
        estCalculable: "oui",
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
    (DeclarationComputerInputBuilder.fromDeclarationDTO as jest.Mock).mockReturnValue({});
    (computeDeclarationIndex as jest.Mock).mockReturnValue({
      index: 80,
      points: 80,
      pointsCalculables: 100,
      computablePoints: 100,
    });
  });

  describe("Form Display", () => {
    it("should not show mesures field when index >= 75", () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: 80,
        points: 80,
        pointsCalculables: 100,
        computablePoints: 100,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 80,
            points: 80,
            pointsCalculables: 100,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      expect(screen.queryByText(/Mesures de correction/)).not.toBeInTheDocument();
      expect(screen.getByText(/Total des points obtenus aux indicateurs calculables/)).toBeInTheDocument();
      expect(
        screen.getByText(/Nombre de points maximum pouvant être obtenus aux indicateurs calculables/),
      ).toBeInTheDocument();
    });

    it("should show mesures field and alert when index < 75", () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: 70,
        points: 70,
        pointsCalculables: 100,
        computablePoints: 100,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
            points: 70,
            pointsCalculables: 100,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      expect(screen.getByText(/Mesures de correction/)).toBeInTheDocument();
      expect(screen.getByText(/Dès lors que l'index est inférieur à 75 points/)).toBeInTheDocument();
      expect(screen.getByText(/Total des points obtenus aux indicateurs calculables/)).toBeInTheDocument();
      expect(
        screen.getByText(/Nombre de points maximum pouvant être obtenus aux indicateurs calculables/),
      ).toBeInTheDocument();
    });

    it("should show index non calculable when index is undefined", () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: undefined,
        points: 0,
        pointsCalculables: 0,
        computablePoints: 0,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          remunerations: {
            estCalculable: "non",
          },
          "resultat-global": {
            points: 0,
            pointsCalculables: 0,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      expect(screen.getByText("Index non calculable")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should disable Suivant button when mesures is required but not selected", () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: 70,
        points: 70,
        pointsCalculables: 100,
        computablePoints: 100,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
            points: 70,
            pointsCalculables: 100,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      expect(screen.getByText("Suivant")).toBeDisabled();
    });

    it("should enable Suivant button when mesures is selected", async () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: 70,
        points: 70,
        pointsCalculables: 100,
        computablePoints: 100,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
            points: 70,
            pointsCalculables: 100,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      const mesuresSelect = screen.getByLabelText(/Mesures de correction/);
      fireEvent.change(mesuresSelect, { target: { value: "mmo" } });

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeEnabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission with mesures when index < 75", async () => {
      (computeDeclarationIndex as jest.Mock).mockReturnValue({
        index: 70,
        points: 70,
        pointsCalculables: 100,
        computablePoints: 100,
      });

      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
            points: 70,
            pointsCalculables: 100,
          },
        },
      });

      renderWithProviders(<ResultatGlobalPage />);

      const mesuresSelect = screen.getByLabelText(/Mesures de correction/);
      fireEvent.change(mesuresSelect, { target: { value: "mmo" } });

      await waitFor(() => {
        expect(screen.getByText("Suivant")).toBeEnabled();
      });

      const suivantButton = screen.getByText("Suivant");
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.saveFormData).toHaveBeenCalledWith({
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
            points: 70,
            pointsCalculables: 100,
            mesures: "mmo",
          },
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
