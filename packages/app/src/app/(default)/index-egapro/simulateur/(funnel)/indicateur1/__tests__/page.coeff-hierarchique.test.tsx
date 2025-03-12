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
  describe("when clicking on radio 'Par niveau ou coefficient hiérarchique en application de la classification de branche'", () => {
    beforeEach(async () => {
      fireEvent.click(r.getByLabelText("Par catégorie socio-professionnelle"));
      await wait();
      fireEvent.click(
        r.getByLabelText("Par niveau ou coefficient hiérarchique en application de la classification de branche"),
      );
    });
    it("should display respective table", async () => {
      await wait();
      expect(r.queryByText("Catégorie socio-professionnelle")).not.toBeInTheDocument();
      expect(r.queryAllByText(/Niveau ou coefficient hiérarchique/)[0]).toBeInTheDocument();
      expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
      // Should not display 2nd part of table
      expect(r.queryByLabelText("Remu moyenne - - :29 - Femmes")).not.toBeInTheDocument();
      expect(r.queryByLabelText("Remu moyenne - - :29 - Hommes")).not.toBeInTheDocument();
      expect(r.queryByText("160 femmes", { exact: false })).toHaveTextContent("0 / 160 femmes");
      expect(r.queryByText("160 hommes", { exact: false })).toHaveTextContent("0 / 160 hommes");
      expect(r.queryByText("320 salarié", { exact: false })).toHaveTextContent("0 / 320 salarié");
    });
    describe("when filling number employees fields", () => {
      beforeEach(async () => {
        fireEvent.change(r.getByLabelText("Niveau ou coefficient hiérarchique"), {
          target: { value: 1 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - :29 - Femmes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 30:39 - Femmes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 40:49 - Femmes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 50: - Femmes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - :29 - Hommes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 30:39 - Hommes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 40:49 - Hommes"), {
          target: { value: 40 },
        });
        fireEvent.change(r.getByLabelText("Nombre de salariés - - 50: - Hommes"), {
          target: { value: 40 },
        });
      });
      it("should display remuneration part of table and correct results", () => {
        expect(r.queryByLabelText("Remu moyenne - - :29 - Femmes")).toBeInTheDocument();
        expect(r.queryByLabelText("Remu moyenne - - :29 - Hommes")).toBeInTheDocument();
        expect(r.queryByText("160 femmes - 160 hommes")).toBeInTheDocument();
        expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
      });
      describe("when reducing by 1 women", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Nombre de salariés - - :29 - Femmes"), {
            target: { value: 39 },
          });
        });
        it("should disable next step & display correct numbers", () => {
          expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
          expect(r.queryByText("160 femmes", { exact: false })).toHaveTextContent("159 / 160 femmes");
          expect(r.queryByText("160 hommes", { exact: false })).toHaveTextContent("160 hommes");
          expect(r.queryByText("320 salarié", { exact: false })).toHaveTextContent("319 / 320 salarié");
        });
      });
      describe("when setting number women employees to 2", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Nombre de salariés - - :29 - Femmes"), {
            target: { value: 2 },
          });
        });
        it("should disable next step", () => {
          expect(r.queryByText("Non pris en compte car moins de 3 femmes")).toBeInTheDocument();
        });
      });
      describe("when emptying hierarchy field", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Niveau ou coefficient hiérarchique"), {
            target: { value: undefined },
          });
        });
        it("should disable next step", () => {
          expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
        });
      });
      describe("when filling remuneration fields", () => {
        beforeEach(() => {
          fireEvent.change(r.getByLabelText("Remu moyenne - - :29 - Femmes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 30:39 - Femmes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 40:49 - Femmes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 50: - Femmes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - :29 - Hommes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 30:39 - Hommes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 40:49 - Hommes"), {
            target: { value: 40000 },
          });
          fireEvent.change(r.getByLabelText("Remu moyenne - - 50: - Hommes"), {
            target: { value: 40000 },
          });
        });
        it("should allow next step", async () => {
          await wait();
          expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
        });
        describe("when clicking 'Ajouter un niveau ou coefficient hiérarchique' button", () => {
          beforeEach(() => {
            fireEvent.click(r.getByRole("button", { name: "Ajouter un niveau ou coefficient hiérarchique" }));
          });
          it("should not allow next step & display new block", () => {
            expect(r.getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
            expect(r.getAllByLabelText("Niveau ou coefficient hiérarchique").length).toBe(2);
          });
          describe("when clicking 'Supprimer' button", () => {
            beforeEach(() => {
              fireEvent.click(r.getByRole("button", { name: "Supprimer" }));
            });
            it("should allow next step & remove new block", () => {
              expect(r.getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
              expect(r.getAllByLabelText("Niveau ou coefficient hiérarchique").length).toBe(1);
            });
          });
        });
      });
    });
  });
});
