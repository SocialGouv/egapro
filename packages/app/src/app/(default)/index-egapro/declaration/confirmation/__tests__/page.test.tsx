/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";

import { sendDeclarationReceipt } from "../../actions";
import ConfirmationPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

// Mock actions
jest.mock("../../actions", () => ({
  sendDeclarationReceipt: jest.fn(),
}));

type FormData = {
  commencer?: {
    annéeIndicateurs: number;
    siren: string;
  };
  "resultat-global"?: {
    index: number;
  };
};

interface FormManagerType {
  formData: FormData;
  resetFormData: () => void;
}

describe("ConfirmationPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
        siren: "123456789",
      },
      "resultat-global": {
        index: 80,
      },
    },
    resetFormData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Display", () => {
    it("should show success message", () => {
      render(<ConfirmationPage />);

      expect(screen.getByText("Votre déclaration a été transmise")).toBeInTheDocument();
      expect(screen.getByText(/Vous allez recevoir un accusé de réception/)).toBeInTheDocument();
    });

    it("should show download link", () => {
      render(<ConfirmationPage />);

      const downloadLink = screen.getByText("Télécharger le récapitulatif de la déclaration");
      expect(downloadLink).toHaveAttribute("href", "/index-egapro/declaration/123456789/2024/pdf");
    });

    it("should show card for index between 75 and 84", () => {
      render(<ConfirmationPage />);

      expect(screen.getByText("Vous avez obtenu un index compris entre 75 et 84 points inclus")).toBeInTheDocument();
      expect(
        screen.getByText(/Vous devez fixer, publier et déclarer des objectifs de progression/),
      ).toBeInTheDocument();
      expect(screen.getByText("Déclarer les objectifs de progression")).toBeInTheDocument();
    });

    it("should show card for index below 75", () => {
      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {
          ...mockFormManager.formData,
          "resultat-global": {
            index: 70,
          },
        },
      });

      render(<ConfirmationPage />);

      expect(screen.getByText("Vous avez obtenu un index inférieur à 75 points")).toBeInTheDocument();
      expect(
        screen.getByText(/Vous devez fixer, publier et déclarer des objectifs de progression et mesures de correction/),
      ).toBeInTheDocument();
      expect(screen.getByText("Déclarer les objectifs de progression et mesures de correction")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should handle resend receipt", async () => {
      (sendDeclarationReceipt as jest.Mock).mockResolvedValue(undefined);

      render(<ConfirmationPage />);

      const resendButton = screen.getByText("Renvoyer l'accusé de réception");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(sendDeclarationReceipt).toHaveBeenCalledWith("123456789", 2024);
      });
    });

    it("should show error on resend receipt failure", async () => {
      (sendDeclarationReceipt as jest.Mock).mockRejectedValue(new Error("Failed to send"));

      render(<ConfirmationPage />);

      const resendButton = screen.getByText("Renvoyer l'accusé de réception");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(sendDeclarationReceipt).toHaveBeenCalledWith("123456789", 2024);
        expect(screen.getByText("Une erreur est survenue, veuillez réessayer ultérieurement.")).toBeInTheDocument();
      });
    });

    it("should handle new declaration", () => {
      render(<ConfirmationPage />);

      const newDeclarationButton = screen.getByText("Effectuer une nouvelle déclaration");
      fireEvent.click(newDeclarationButton);

      expect(mockFormManager.resetFormData).toHaveBeenCalled();
    });
  });

  describe("Redirection", () => {
    it("should redirect if no year", () => {
      // @ts-ignore
      (useDeclarationFormManager as jest.Mock).mockReturnValue({
        ...mockFormManager,
        formData: {},
      });

      render(<ConfirmationPage />);

      expect(mockRouter.push).toHaveBeenCalledWith("/index-egapro/declaration/commencer");
    });
  });
});
