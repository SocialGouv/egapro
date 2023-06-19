import { YEARS_REPEQ } from "@common/dict";
import { AbstractSpecification, ValidationError } from "@common/shared-domain";
import { getYear } from "date-fns";

import { type RepresentationEquilibree } from "../RepresentationEquilibree";

export class RepresentationEquilibreeSpecification extends AbstractSpecification<RepresentationEquilibree> {
  private _lastError?: ValidationError;
  public isSatisfiedBy(repEq: RepresentationEquilibree): boolean {
    try {
      this.assertYear(repEq);
      this.assertReferencePeriode(repEq);
      this.assertRequiredFields(repEq);
      this.assertIndicators(repEq);
      return true;
    } catch (e: unknown) {
      if (e instanceof ValidationError) {
        this._lastError = e;
        return false;
      } else {
        throw e;
      }
    }
  }

  get lastError() {
    return this._lastError;
  }

  private assertYear(repEq: RepresentationEquilibree): asserts repEq {
    const year = repEq.year.getValue();

    if (!YEARS_REPEQ.includes(year)) {
      throw new RepresentationEquilibreeBadYearError(
        `L'année de déclaration de la représentation équilibrée doit être comprise dans la liste suivante : ${YEARS_REPEQ.join(
          ", ",
        )}.`,
      );
    }
  }

  private assertReferencePeriode(repEq: RepresentationEquilibree): asserts repEq {
    const endOfPeriod = repEq.endReferencePeriod;
    const year = repEq.year.getValue();
    if (getYear(endOfPeriod) !== year) {
      throw new RepresentationEquilibreeYearPeriodError(
        "L'année de la date de fin de la période doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés.",
      );
    }
  }

  private assertRequiredFields(repEq: RepresentationEquilibree): asserts repEq {
    if (repEq.publication) {
      if (!repEq.publication.modalities && !repEq.publication.url) {
        throw new RepresentationEquilibreeMissingFieldError(
          "Soit l'url soit la modalité de publication sont obligatoires.",
        );
      }
    }

    if (
      !repEq.indicator.notComputableReasonExecutives &&
      (!repEq.indicator.executiveMenPercent || !repEq.indicator.executiveWomenPercent)
    ) {
      throw new RepresentationEquilibreeMissingFieldError(
        "Soit un motif de non calculabilité, soit les valeurs en pourcentage sont obligatoires pour le calcul des écarts cadres.",
      );
    }

    if (
      !repEq.indicator.notComputableReasonMembers &&
      (!repEq.indicator.memberMenPercent || !repEq.indicator.memberWomenPercent)
    ) {
      throw new RepresentationEquilibreeMissingFieldError(
        "Soit un motif de non calculabilité, soit les valeurs en pourcentage sont obligatoires pour le calcul des écarts membres.",
      );
    }
  }

  private assertIndicators(repEq: RepresentationEquilibree): asserts repEq {
    if (repEq.indicator.executiveMenPercent && repEq.indicator.executiveWomenPercent) {
      const menPercent = repEq.indicator.executiveMenPercent.getValue();
      const womenPercent = repEq.indicator.executiveWomenPercent.getValue();

      if (menPercent + womenPercent !== 100) {
        throw new RepresentationEquilibreeBadPercentError(
          "La sommes des pourcentages des écarts cadres doit être égale à 100.",
        );
      }
    }

    if (repEq.indicator.memberMenPercent && repEq.indicator.memberWomenPercent) {
      const menPercent = repEq.indicator.memberMenPercent.getValue();
      const womenPercent = repEq.indicator.memberWomenPercent.getValue();

      if (menPercent + womenPercent !== 100) {
        throw new RepresentationEquilibreeBadPercentError(
          "La sommes des pourcentages des écarts membres doit être égale à 100.",
        );
      }
    }
  }
}

export class RepresentationEquilibreeSpecificationError extends ValidationError {}
export class RepresentationEquilibreeMissingFieldError extends RepresentationEquilibreeSpecificationError {}
export class RepresentationEquilibreeBadYearError extends RepresentationEquilibreeSpecificationError {}
export class RepresentationEquilibreeYearPeriodError extends RepresentationEquilibreeSpecificationError {}
export class RepresentationEquilibreeBadPercentError extends RepresentationEquilibreeSpecificationError {}
