import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { receiptResponse } from "./mock/server-handlers";
import { useFormManagerMockValidationPageData } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import TransmissionPage from "@/pages/representation-equilibree/transmission";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockValidationPageData());

describe("Transmission page", () => {
  const spies = {} as { routerChangeStart: jest.Mock };

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render buttons and link`, () => {
    render(<TransmissionPage />);

    const sendButton = screen.getByRole("button", { name: /renvoyer l'accusé de réception/i });
    const newDeclaration = screen.getByRole("link", {
      name: /effectuer une nouvelle déclaration/i,
    });
    const download = screen.getByRole("link", {
      name: /télécharger le récapitulatif/i,
    });
    expect(sendButton).toBeInTheDocument();
    expect(newDeclaration).toBeInTheDocument();
    expect(download).toBeInTheDocument();
  });

  it(`should resend`, async () => {
    render(<TransmissionPage />);

    const sendButton = screen.getByRole("button", { name: /renvoyer l'accusé de réception/i });
    // when user click send button
    await userEvent.click(sendButton);

    // expected
    await waitFor(() => {
      expect(receiptResponse).toHaveBeenCalled();
    });
  });

  it("should navigate to Commencer page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <TransmissionPage />
      </RouterContext.Provider>,
    );
    const newDeclaration = screen.getByRole("link", {
      name: /effectuer une nouvelle déclaration/i,
    });
    expect(newDeclaration).toBeInTheDocument();

    // when
    await userEvent.click(newDeclaration);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenNthCalledWith(1, "./commencer", {
        shallow: false,
      });
    });
    expect(spies.routerChangeStart).toHaveBeenNthCalledWith(2, "/representation-equilibree/assujetti", {
      shallow: false,
    });
  });
});
