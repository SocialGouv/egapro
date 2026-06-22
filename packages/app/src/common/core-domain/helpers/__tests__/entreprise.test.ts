import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";

import { isCompanyClosed } from "../entreprise";

const makeCompany = (dateCessation?: string): Entreprise => ({ dateCessation }) as Entreprise;

describe("isCompanyClosed", () => {
  it("returns false when the company has no dateCessation", () => {
    expect(isCompanyClosed(makeCompany(undefined), 2023)).toBe(false);
  });

  it("returns true when the company closed years before the indicators period", () => {
    expect(isCompanyClosed(makeCompany("2017-01-03"), 2023)).toBe(true);
  });

  it("returns true when closed before 1 March of the year after the indicators year", () => {
    expect(isCompanyClosed(makeCompany("2024-02-01"), 2023)).toBe(true);
  });

  it("returns false when closed after 1 March of the year after the indicators year", () => {
    expect(isCompanyClosed(makeCompany("2024-04-01"), 2023)).toBe(false);
  });
});
