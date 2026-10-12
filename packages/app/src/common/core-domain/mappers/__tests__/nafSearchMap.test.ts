import { type Declaration } from "../../domain/Declaration";
import { Company } from "../../domain/declaration/Company";
import { type RepresentationEquilibree } from "../../domain/RepresentationEquilibree";
import { NafCode } from "../../domain/valueObjects/NafCode";
import { Siren } from "../../domain/valueObjects/Siren";
import { declarationSearchMap } from "../declarationSearchMap";
import { representationEquilibreeSearchMap } from "../representationEquilibreeSearchMap";

const companyWithNaf = (code?: string) =>
  new Company({
    name: "Entreprise de test",
    nafCode: code ? new NafCode(code) : undefined,
    siren: new Siren("384964508"),
  });

describe.each([
  ["62.01Z", "J"],
  ["03.11Y", ""],
  ["99.99Z", ""],
  [undefined, ""],
])("search maps with NAF code %s", (code, section) => {
  it("uses the known section or an empty fallback for declarations", () => {
    const declaration = {
      company: companyWithNaf(code),
      declaredAt: new Date("2025-01-01T00:00:00.000Z"),
      siren: { getValue: () => "123456789" },
      year: { getValue: () => 2024 },
    } as unknown as Declaration;

    expect(declarationSearchMap.toPersistence(declaration).section_naf).toBe(section);
  });

  it("uses the known section or an empty fallback for representation", () => {
    const representation = {
      company: companyWithNaf(code),
      declaredAt: new Date("2025-01-01T00:00:00.000Z"),
      siren: { getValue: () => "123456789" },
      year: { getValue: () => 2024 },
    } as unknown as RepresentationEquilibree;

    expect(representationEquilibreeSearchMap.toPersistence(representation).section_naf).toBe(section);
  });
});
