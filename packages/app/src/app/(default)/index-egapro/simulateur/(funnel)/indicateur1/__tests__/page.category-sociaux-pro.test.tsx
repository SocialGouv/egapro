import { fireEvent, render, type RenderResult } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";

import Indicateur1Page from "../page";
import { effectifs } from "./mock";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: undefined })),
}));

jest.mock("../../../../../../../common/utils/zustand", () => ({
  storePicker: () => () => [
    {
      effectifs,
    },
    () => {},
  ],
}));

jest.mock("../../useSimuFunnelStore", () => ({
  useSimuFunnelStore: () => ({ effectifs }),
  useSimuFunnelStoreHasHydrated: () => true,
}));

describe("when rendering", () => {
  let r: RenderResult;
  beforeEach(() => {
    r = render(<Indicateur1Page />);
  });
  describe("when clicking on radio 'Par catégorie socio-professionnelle'", () => {
    beforeEach(async () => {
      await wait();
      fireEvent.click(r.getByLabelText("Par catégorie socio-professionnelle"));
    });
    it("should display respective table", async () => {
      await wait();
      expect(r.queryByText("Catégorie socio-professionnelle")).toBeInTheDocument();
      expect(r.queryByText(/Niveau ou coefficient hiérarchique/)).not.toBeInTheDocument();
      expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
    });
    describe("when filling all fields", () => {
      beforeEach(async () => {
        // ouv
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - :29 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 30:39 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 40:49 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 50: - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - :29 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 30:39 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 40:49 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ouv - 50: - Hommes"), {
          target: { value: 40000 },
        });
        // emp
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - :29 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 30:39 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 40:49 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 50: - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - :29 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 30:39 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 40:49 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - emp - 50: - Hommes"), {
          target: { value: 40000 },
        });
        // tam
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - :29 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 30:39 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 40:49 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 50: - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - :29 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 30:39 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 40:49 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - tam - 50: - Hommes"), {
          target: { value: 40000 },
        });
        // ic
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - :29 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 30:39 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 40:49 - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 50: - Femmes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - :29 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 30:39 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 40:49 - Hommes"), {
          target: { value: 40000 },
        });
        fireEvent.change(r.getByLabelText("Remu moyenne - ic - 50: - Hommes"), {
          target: { value: 40000 },
        });
      });
      it("should allow next step", async () => {
        await wait();
        expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
      });
      describe("when giving advantage to women", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Remu moyenne - ouv - :29 - Femmes"), {
            target: { value: 50000 },
          });
        });
        it("should display informations for women advantage", () => {
          expect(r.getByText("L'écart de rémunération est en faveur des femmes")).toBeInTheDocument();
        });
      });
      describe("when giving advantage to men", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Remu moyenne - ouv - :29 - Hommes"), {
            target: { value: 50000 },
          });
        });
        it("should display informations for men advantage", () => {
          expect(r.getByText("L'écart de rémunération est en faveur des hommes")).toBeInTheDocument();
        });
      });
      describe("when unfilling a field", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Remu moyenne - ouv - :29 - Femmes"), {
            target: { value: 0 },
          });
        });
        it("should disable next step button", async () => {
          await wait();
          expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
        });
      });
    });
  });
});
