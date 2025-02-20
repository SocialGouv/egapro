import { fireEvent, render, type RenderResult } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";

import { effectifs } from "../../indicateur1/__tests__/mock";
import Indicateur5Page from "../page";
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
    r = render(<Indicateur5Page />);
  });
  it("should forbid next step", async () => {
    await wait();
    expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
  });
  describe("when filling number women among 10 highest remunerations", () => {
    beforeEach(async () => {
      await wait();
      fireEvent.change(r.getByLabelText(/Nombre de femmes parmi les 10 plus hautes rémunérations/), {
        target: { value: 3 },
      });
    });
    it("should automatically fill the men field & allow next step", async () => {
      await wait();
      expect(r.getByLabelText(/Nombre d'hommes parmi les 10 plus hautes rémunérations/)).toHaveValue(7);
      expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
    });
    describe("when filling number men among 10 highest remunerations", () => {
      beforeEach(async () => {
        await wait();
        fireEvent.change(r.getByLabelText(/Nombre d'hommes parmi les 10 plus hautes rémunérations/), {
          target: { value: 4 },
        });
      });
      it("should automatically fill the women field & allow next step", async () => {
        await wait();
        expect(r.getByLabelText(/Nombre de femmes parmi les 10 plus hautes rémunérations/)).toHaveValue(6);
        expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
      });
      describe("when unfilling number men among 10 highest remunerations", () => {
        beforeEach(async () => {
          await wait();
          fireEvent.change(r.getByLabelText(/Nombre d'hommes parmi les 10 plus hautes rémunérations/), {
            target: { value: null },
          });
        });
        it("should not allow next step", async () => {
          await wait();
          expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
        });
      });
    });
  });
});
