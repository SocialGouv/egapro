/* eslint-disable @typescript-eslint/ban-ts-comment */

import { computerHelper } from "../computerHelper";
import data from "./less_than_250_employees.json";

describe("Test des calculs avec moins de 250 employés dans l'entreprise", () => {
  it.each(data)(
    "%#) Vérifier le calcul sur computerHelper",
    ({
      effectifs,
      indicateur1,
      indicateur2and3,
      indicateur4,
      indicateur5,
      resultIndicateur1,
      resultIndicateur2and3,
      resultIndicateur4,
      resultIndicateur5,
      result,
    }) => {
      const computerHelperResult = computerHelper({
        // @ts-ignore
        effectifs,
        // @ts-ignore
        indicateur1,
        // @ts-ignore
        indicateur2and3,
        // @ts-ignore
        indicateur4,
        indicateur5,
      });

      const {
        resultIndicateurUn,
        resultIndicateurDeuxTrois,
        resultIndicateurQuatre,
        resultIndicateurCinq,
        resultIndex,
      } = computerHelperResult;

      expect(resultIndicateurUn.favorablePopulation).toEqual(resultIndicateur1.favorablePopulation);
      expect(resultIndicateurUn.note).toEqual(resultIndicateur1.note);
      expect(resultIndicateurUn.result).toEqual(resultIndicateur1.result);

      if (typeof resultIndicateur2and3 !== "boolean" && resultIndicateurDeuxTrois) {
        expect(resultIndicateurDeuxTrois.favorablePopulation).toEqual(resultIndicateur2and3.favorablePopulation);
        expect(resultIndicateurDeuxTrois.note).toEqual(resultIndicateur2and3.note);
        expect(resultIndicateurDeuxTrois.result).toEqual(resultIndicateur2and3.result);
      }

      if (typeof resultIndicateur4 !== "boolean" && resultIndicateurQuatre) {
        // @ts-ignore
        expect(resultIndicateurQuatre.favorablePopulation).toEqual(resultIndicateur4.favorablePopulation);
        // @ts-ignore
        expect(resultIndicateurQuatre.note).toEqual(resultIndicateur4.note);
        // @ts-ignore
        expect(resultIndicateurQuatre.result).toEqual(resultIndicateur4.result);
      }

      expect(resultIndicateurCinq.favorablePopulation).toEqual(resultIndicateur5.favorablePopulation);
      expect(resultIndicateurCinq.note).toEqual(resultIndicateur5.note);
      expect(resultIndicateurCinq.result).toEqual(resultIndicateur5.result);

      expect(resultIndex.favorablePopulation).toEqual(result.favorablePopulation);
      expect(resultIndex.note).toEqual(result.note);
    },
  );
});
