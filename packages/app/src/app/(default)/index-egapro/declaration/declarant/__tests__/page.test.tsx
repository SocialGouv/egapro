/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";
import { useRouter } from "next/navigation";

import DeclarantPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("@services/apiClient/useDeclarationFormManager", () => ({
  useDeclarationFormManager: jest.fn(),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        email: "test@test.com",
        firstname: "John",
        lastname: "Doe",
        phoneNumber: "0123456789",
        staff: false,
      },
    },
    status: "authenticated",
  })),
}));

// Mock getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(() => ({
    user: {
      email: "test@test.com",
      firstname: "John",
      lastname: "Doe",
      phoneNumber: "0123456789",
      staff: false,
    },
  })),
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
  declarant?: {
    accordRgpd: boolean;
    email: string;
    nom: string;
    prénom: string;
    téléphone: string;
  };
};

interface FormManagerType {
  formData: FormData;
  savePageData: (page: keyof DeclarationDTO, data: DeclarationDTO[keyof DeclarationDTO] | undefined) => void;
}

describe("DeclarantPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormManager: FormManagerType = {
    formData: {
      commencer: {
        annéeIndicateurs: 2024,
      },
    },
    savePageData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // @ts-ignore
    (useDeclarationFormManager as jest.Mock).mockReturnValue(mockFormManager);
  });

  describe("Page Display", () => {
    it("should show info alert about ProConnect", async () => {
      const page = await DeclarantPage();
      if (!page) return;

      render(page);

      expect(screen.getByText(/Les informations déclarant sont préremplies/)).toBeInTheDocument();
      expect(screen.getByText(/votre profil ProConnect/)).toBeInTheDocument();
    });

    it("should show declarant fields", async () => {
      const page = await DeclarantPage();
      if (!page) return;

      render(page);

      await wait();
      expect(screen.getByLabelText(/Nom du déclarant/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Prénom/)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Téléphone/)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission", async () => {
      const page = await DeclarantPage();
      if (!page) return;

      render(page);

      const nomInput = screen.getByLabelText(/Nom/);
      fireEvent.change(nomInput, { target: { value: "Doe" } });

      const prenomInput = screen.getByLabelText(/Prénom/);
      fireEvent.change(prenomInput, { target: { value: "John" } });

      const emailInput = screen.getByLabelText(/email/);
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });

      const telephoneInput = screen.getByLabelText(/Téléphone/);
      fireEvent.change(telephoneInput, { target: { value: "0123456789" } });

      await wait();
      const suivantButton = screen.getByText("Suivant");
      expect(suivantButton).toBeEnabled();
      fireEvent.click(suivantButton);

      await waitFor(() => {
        expect(mockFormManager.savePageData).toHaveBeenCalledWith("declarant", {
          accordRgpd: true,
          email: "test@test.com",
          nom: "Doe",
          prénom: "John",
          téléphone: "0123456789",
        });
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });
});
