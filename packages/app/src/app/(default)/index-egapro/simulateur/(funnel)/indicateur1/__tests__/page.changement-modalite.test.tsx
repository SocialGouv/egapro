import "@design-system/utils/client/__tests__/animationPolyfills";

import { act, fireEvent, render, type RenderResult } from "@testing-library/react";

import Indicateur1Page from "../page";
import { effectifs } from "./mock";

jest.unmock("@formkit/auto-animate/react");

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: undefined })),
}));

jest.mock("@common/utils/zustand", () => ({
  storePicker: () => () => [{ effectifs }, () => {}],
}));

jest.mock("../../useSimuFunnelStore", () => {
  const { useEffect, useState } = jest.requireActual("react");
  return {
    useSimuFunnelStore: () => ({ effectifs }),
    // Like the real hook: not hydrated until the component has mounted, so a newly mounted table
    // first renders nothing, then its rows.
    useSimuFunnelStoreHasHydrated: () => {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);
      return mounted;
    },
  };
});

const MODE = {
  csp: "Par catégorie socio-professionnelle",
  branche: "Par niveau ou coefficient hiérarchique en application de la classification de branche",
  autre: "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
};

// Lets auto-animate record the positions of the children (after its 250 ms animation delay).
const settle = (ms = 300) => act(() => new Promise(resolve => setTimeout(resolve, ms)));

describe("<Indicateur1Page /> — changement de modalité avec les animations", () => {
  let r: RenderResult;
  let errors: unknown[];
  const onError = (event: ErrorEvent) => {
    errors.push(event.error ?? event.message);
    event.preventDefault();
  };

  const choose = async (mode: keyof typeof MODE, ms?: number) => {
    fireEvent.click(r.getByLabelText(MODE[mode]));
    await settle(ms);
  };

  const showsCspTable = () => r.queryByText("Catégorie socio-professionnelle") !== null;

  beforeEach(async () => {
    errors = [];
    window.addEventListener("error", onError);
    r = render(<Indicateur1Page />);
    await settle();
    await choose("branche");
    fireEvent.change(r.getByLabelText("Niveau ou coefficient hiérarchique"), { target: { value: "Niveau A" } });
    for (const age of [":29", "30:39", "40:49", "50:"]) {
      for (const sex of ["Femmes", "Hommes"]) {
        fireEvent.change(r.getByLabelText(`Nombre de salariés - - ${age} - ${sex}`), { target: { value: 40 } });
      }
    }
    await settle();
  });

  afterEach(() => {
    window.removeEventListener("error", onError);
  });

  it("revient au mode CSP sans erreur DOM après une saisie par niveaux", async () => {
    await choose("csp");

    expect(errors).toEqual([]);
    expect(showsCspTable()).toBe(true);
    expect(r.queryByLabelText("Niveau ou coefficient hiérarchique")).not.toBeInTheDocument();
  });

  it("restaure la saisie par niveaux après un aller-retour par CSP et l'autre modalité", async () => {
    await choose("csp");
    await choose("autre");
    await choose("branche");
    await choose("csp");
    await choose("branche");

    expect(errors).toEqual([]);
    expect(showsCspTable()).toBe(false);
    expect(r.getAllByLabelText("Niveau ou coefficient hiérarchique")).toHaveLength(1);
    expect(r.getByLabelText("Niveau ou coefficient hiérarchique")).toHaveValue("Niveau A");
    expect(r.getByLabelText("Nombre de salariés - Niveau A - :29 - Femmes")).toHaveValue(40);
  });

  it("supporte des changements rapides pendant les animations", async () => {
    for (let round = 0; round < 3; round++) {
      for (const mode of ["csp", "branche", "csp", "autre"] as const) await choose(mode, 20);
    }
    await choose("branche");

    expect(errors).toEqual([]);
    expect(showsCspTable()).toBe(false);
    expect(r.getByLabelText("Niveau ou coefficient hiérarchique")).toHaveValue("Niveau A");
  });
});
