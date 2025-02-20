import { fireEvent, render, type RenderResult } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";

import { effectifs } from "../../indicateur1/__tests__/mock";
import Indicateur2et3Page from "../page";
import { indicateur1 } from "./mock";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: undefined })),
}));

jest.mock("../../../../../../../common/utils/zustand", () => ({
  storePicker: () => () => [
    {
      effectifs,
      indicateur1,
    },
    () => {},
  ],
}));

jest.mock("../../useSimuFunnelStore", () => ({
  useSimuFunnelStore: () => ({ effectifs, indicateur1 }),
  useSimuFunnelStoreHasHydrated: () => true,
}));

describe("when rendering", () => {
  let r: RenderResult;
  beforeEach(() => {
    r = render(<Indicateur2et3Page />);
  });
  it("should forbid next step", async () => {
    await wait();
    expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
  });
  describe("when clicking on radio 'Non'", () => {
    beforeEach(async () => {
      await wait();
      fireEvent.click(r.getByLabelText("Non"));
    });
    it("should display warning & allow next step", async () => {
      await wait();
      expect(r.queryByText("L'indicateur n'est pas calculable")).toBeInTheDocument();
      expect(r.queryByText("Catégorie socio-professionnelle")).not.toBeInTheDocument();

      expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
    });
  });
  describe("when clicking on radio 'Oui'", () => {
    beforeEach(async () => {
      await wait();
      fireEvent.click(r.getByLabelText("Oui"));
    });
    it("should forbid next step", async () => {
      await wait();
      expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
    });
    describe("when filling number of raised employees fields", () => {
      beforeEach(async () => {
        await wait();
        fireEvent.change(r.getByLabelText(/Femmes/), {
          target: { value: 10 },
        });
        fireEvent.change(r.getByLabelText(/Hommes/), {
          target: { value: 10 },
        });
      });
      it("should allow next step", async () => {
        await wait();
        expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
      });
    });
  });
});
