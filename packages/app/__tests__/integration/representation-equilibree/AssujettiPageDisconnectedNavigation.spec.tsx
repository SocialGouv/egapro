import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useUserMock } from "./mock/user";
import AssujetiPage from "@/pages/representation-equilibree/assujetti";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(false));

describe("Assujetti Page : disconnected mode ", () => {
  const spies = {} as { routerChangeStart: jest.Mock };

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it("should navigate to Email page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <AssujetiPage />
      </RouterContext.Provider>,
    );
    const nextButton = screen.getByRole("link", { name: /Suivant/i });
    expect(nextButton).toBeInTheDocument();

    // when
    fireEvent.click(nextButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
    });
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/email", { shallow: false });
  });
});
