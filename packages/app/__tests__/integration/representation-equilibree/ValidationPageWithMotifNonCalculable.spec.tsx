import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMockValidationPageDataNotCalculable } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import ValidationPage from "@/pages/representation-equilibree/validation";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockValidationPageDataNotCalculable());

describe("Validation page", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should not render motifs non calculable for Cadres and Membres" field`, () => {
    render(<ValidationPage />);
    const motifsCadres = screen.getByText(/Aucun cadre dirigeant/i);
    const motifsMembres = screen.getByText(/Aucune instance dirigeante/i);
    expect(motifsCadres).toBeInTheDocument();
    expect(motifsMembres).toBeInTheDocument();
  });

  it("should navigate to ecarts-membres page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <ValidationPage />
      </RouterContext.Provider>,
    );
    const backButton = screen.getByRole("link", { name: /Précédent/i });
    expect(backButton).toBeInTheDocument();

    // when
    await userEvent.click(backButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/ecarts-membres", {
        shallow: false,
      });
    });
  });
});
