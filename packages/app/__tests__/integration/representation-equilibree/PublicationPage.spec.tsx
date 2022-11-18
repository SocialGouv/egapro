import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMockPublishingPageData } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import PublicationPage from "@/pages/representation-equilibree/publication";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockPublishingPageData());

describe("Publication page", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render radio input set to "Oui" on first render`, () => {
    render(<PublicationPage />);

    const datePublication = screen.getByLabelText(/date de publication des écarts calculables/i);
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const urlInput = screen.getByRole("textbox", {
      name: /^indiquer l'adresse exacte de la page internet/i,
    });

    // const urlInput = screen.getByPlaceholderText(/https:\/\//i);
    const publishingContent = screen.queryByRole("textbox", {
      name: /préciser les modalités de communication des écarts calculables auprès de vos salariés/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(datePublication).toHaveValue("");
    expect(ouiInput).toBeChecked();
    expect(nonInput).not.toBeChecked();
    expect(urlInput).toHaveValue("");
    expect(publishingContent).not.toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it(`should forbid old publishing date `, async () => {
    render(<PublicationPage />);
    const datePublication = screen.getByLabelText(/date de publication des écarts calculables/i);
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when user input
    await userEvent.type(datePublication, "2019-01-15");

    // expected
    await waitFor(() => {
      expect(ouiInput).toBeChecked();
      expect(nonInput).not.toBeChecked();
      expect(submitButton).toBeDisabled();
      const errorDate = screen.getByText(
        /la date de publication ne peut précéder la date de fin de la période de référence \(31\/12\/2021\)/i,
      );
      expect(errorDate).toBeInTheDocument();
    });
  });

  it(`should render publishing content`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PublicationPage />
      </RouterContext.Provider>,
    );
    const datePublication = screen.getByLabelText(/date de publication des écarts calculables/i);
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const urlInput = screen.getByRole("textbox", {
      name: /^indiquer l'adresse exacte de la page internet/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when
    await userEvent.click(nonInput);
    const publishingContent = screen.getByRole("textbox", {
      name: /préciser les modalités de communication des écarts calculables auprès de vos salariés/i,
    });

    // expected
    await waitFor(() => {
      expect(datePublication).toHaveValue("");
      expect(ouiInput).not.toBeChecked();
      expect(nonInput).toBeChecked();
      expect(urlInput).not.toBeInTheDocument();
      expect(publishingContent).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it(`should navigate to validation page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PublicationPage />
      </RouterContext.Provider>,
    );
    const datePublication = screen.getByLabelText(/date de publication des écarts calculables/i);
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when step 1
    await userEvent.click(nonInput);
    const publishingContent = screen.getByRole("textbox", {
      name: /préciser les modalités de communication des écarts calculables auprès de vos salariés/i,
    });
    await userEvent.type(datePublication, "2023-01-15");
    await userEvent.type(publishingContent, "A");

    // expected step 1
    await waitFor(() => {
      expect(ouiInput).not.toBeChecked();
      expect(nonInput).toBeChecked();
      expect(submitButton).toBeEnabled();
    });

    // when step 2
    await userEvent.click(submitButton);

    // expected step 2
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/validation", {
        shallow: false,
      });
    });
  });

  it(`should also navigate to validation page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PublicationPage />
      </RouterContext.Provider>,
    );
    const datePublication = screen.getByLabelText(/date de publication des écarts calculables/i);
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const urlInput = screen.getByRole("textbox", {
      name: /^indiquer l'adresse exacte de la page internet/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when user sets input
    await userEvent.type(datePublication, "2023-01-15");
    await userEvent.type(urlInput, "google.com");

    // expected
    await waitFor(() => {
      expect(ouiInput).toBeChecked();
      expect(nonInput).not.toBeChecked();
      expect(submitButton).toBeEnabled();
    });

    // when user submit
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/validation", {
        shallow: false,
      });
    });
  });

  it("should navigate to ecarts membres page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PublicationPage />
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

  it(`should render url validation error`, async () => {
    render(<PublicationPage />);

    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });
    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });
    const urlInput = screen.getByRole("textbox", {
      name: /^indiquer l'adresse exacte de la page internet/i,
    });

    // when
    await userEvent.type(urlInput, "toto");

    // expected
    await waitFor(() => {
      expect(ouiInput).toBeChecked();
      expect(nonInput).not.toBeChecked();
      const errorUrl = screen.getByText(/l'adresse de la page internet est invalide/i);
      expect(errorUrl).toBeInTheDocument();
    });
  });
});
