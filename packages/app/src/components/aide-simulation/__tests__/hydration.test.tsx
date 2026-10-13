import { expectToHydrateWithoutMismatch } from "@common/utils/__tests__/hydration";

import { AideSimulationIndicateurDeux } from "../IndicateurDeux";
import { AideSimulationIndicateurTrois } from "../IndicateurTrois";
import { AideSimulationIndicateurUn } from "../IndicateurUn";

describe("Aide simulation hydration", () => {
  it.each([
    ["indicateur 1", <AideSimulationIndicateurUn.CommentEstCalculéLIndicateur key="1" />],
    ["indicateur 2", <AideSimulationIndicateurDeux.CommentEstCalculéLIndicateur key="2" />],
    ["indicateur 3", <AideSimulationIndicateurTrois.CommentEstCalculéLIndicateur key="3" />],
  ])("should hydrate the calculation help of %s without mismatch", async (_, element) => {
    await expectToHydrateWithoutMismatch(element);
  });
});
