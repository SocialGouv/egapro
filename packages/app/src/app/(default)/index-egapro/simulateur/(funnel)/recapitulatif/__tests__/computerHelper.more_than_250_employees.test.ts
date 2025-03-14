/* eslint-disable @typescript-eslint/ban-ts-comment */

import { computerHelper } from "../computerHelper";
import data from "./more_than_250_employess.json";

describe("Test des calculs avec plus de 250 employés dans l'entreprise", () => {
  it.each(data)(
    "%#) Vérifier le calcul sur computerHelper",
    ({
      effectifs,
      indicateur1,
      indicateur2,
      indicateur3,
      indicateur4,
      indicateur5,
      resultIndicateur1,
      resultIndicateur2,
      resultIndicateur3,
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
        indicateur2,
        // @ts-ignore
        indicateur3,
        // @ts-ignore
        indicateur4,
        indicateur5,
      });

      const {
        resultIndicateurUn,
        resultIndicateurDeux,
        resultIndicateurTrois,
        resultIndicateurQuatre,
        resultIndicateurCinq,
        resultIndex,
      } = computerHelperResult;

      expect(resultIndicateurUn.favorablePopulation).toEqual(resultIndicateur1.favorablePopulation);
      expect(resultIndicateurUn.note).toEqual(resultIndicateur1.note);
      expect(resultIndicateurUn.result).toEqual(resultIndicateur1.result);

      if (typeof resultIndicateur2 !== "boolean" && resultIndicateurDeux) {
        expect(resultIndicateurDeux.favorablePopulation).toEqual(resultIndicateur2.favorablePopulation);
        expect(resultIndicateurDeux.note).toEqual(resultIndicateur2.note);
        expect(resultIndicateurDeux.result).toEqual(resultIndicateur2.result);
      }

      if (typeof resultIndicateur3 !== "boolean" && resultIndicateurTrois) {
        expect(resultIndicateurTrois.favorablePopulation).toEqual(resultIndicateur3.favorablePopulation);
        expect(resultIndicateurTrois.note).toEqual(resultIndicateur3.note);
        expect(resultIndicateurTrois.result).toEqual(resultIndicateur3.result);
      }

      if (typeof resultIndicateur4 !== "boolean" && resultIndicateurQuatre) {
        expect(resultIndicateurQuatre.favorablePopulation).toEqual(resultIndicateur4.favorablePopulation);
        expect(resultIndicateurQuatre.note).toEqual(resultIndicateur4.note);
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
