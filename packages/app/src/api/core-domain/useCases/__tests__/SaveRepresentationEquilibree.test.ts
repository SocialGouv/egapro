import { type Entreprise, type IEntrepriseService } from "@api/core-domain/infra/services/IEntrepriseService";
import { type IRepresentationEquilibreeRepo } from "@api/core-domain/repo/IRepresentationEquilibreeRepo";
import { type RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";

import { SaveRepresentationEquilibree, SaveRepresentationEquilibreeClosedCompanyError } from "../SaveRepresentationEquilibree";

const SIREN = "384964508";
const YEAR = 2023;

const makeEntreprise = (dateCessation?: string): Entreprise =>
  ({
    activitePrincipale: "62.02A",
    activitePrincipaleUniteLegale: "62.02A",
    caractereEmployeurUniteLegale: "O",
    categorieJuridiqueUniteLegale: "5710",
    conventions: [],
    dateCreationUniteLegale: "2010-01-01",
    dateDebut: "2010-01-01",
    etablissements: 1,
    etatAdministratifUniteLegale: dateCessation ? "C" : "A",
    highlightLabel: "ACME SARL",
    label: "ACME SARL",
    matching: 1,
    simpleLabel: "ACME SARL",
    siren: SIREN,
    ...(dateCessation ? { dateCessation } : {}),
    allMatchingEtablissements: [],
    firstMatchingEtablissement: {
      activitePrincipaleEtablissement: "62.02A",
      address: "1 RUE DE TEST 75001 PARIS",
      codeCommuneEtablissement: "75101",
      codePostalEtablissement: "75001",
      etablissementSiege: true,
      libelleCommuneEtablissement: "PARIS",
      siret: "38496450800014",
    },
  }) as Entreprise;

const makeDto = (): CreateRepresentationEquilibreeDTO =>
  ({ siren: SIREN, year: YEAR }) as unknown as CreateRepresentationEquilibreeDTO;

const makeUseCase = (opts: { entreprise?: Entreprise; found?: RepresentationEquilibree | null } = {}) => {
  const saveWithIndex = jest.fn().mockResolvedValue(undefined);
  const getOne = jest.fn().mockResolvedValue(opts.found ?? null);
  const siren = jest.fn().mockResolvedValue(opts.entreprise ?? makeEntreprise("2017-01-03"));
  const repo = { getOne, saveWithIndex } as unknown as IRepresentationEquilibreeRepo;
  const service = { siren } as unknown as IEntrepriseService;
  return { useCase: new SaveRepresentationEquilibree(repo, service), saveWithIndex, getOne, siren };
};

// The guard must not fire; the downstream flow may still reject for unrelated (minimal-DTO) reasons,
// so we only assert that the rejection — if any — is not the closed-company guard.
const expectNotBlockedAsClosed = (promise: Promise<unknown>) =>
  promise.catch(error => {
    expect(error).not.toBeInstanceOf(SaveRepresentationEquilibreeClosedCompanyError);
  });

describe("SaveRepresentationEquilibree — closed-company guard", () => {
  it("blocks creating a representation for a closed company", async () => {
    const { useCase, saveWithIndex } = makeUseCase({ entreprise: makeEntreprise("2017-01-03") });

    await expect(useCase.execute({ repEq: makeDto() })).rejects.toBeInstanceOf(
      SaveRepresentationEquilibreeClosedCompanyError,
    );
    expect(saveWithIndex).not.toHaveBeenCalled();
  });

  it("lets staff (override) save for a closed company", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise("2017-01-03") });

    await expectNotBlockedAsClosed(useCase.execute({ repEq: makeDto(), override: true }));
  });

  it("does not even fetch the company (nor block) when editing an existing representation", async () => {
    const { useCase, siren } = makeUseCase({
      found: { declaredAt: new Date(), fromJson: () => ({}) } as unknown as RepresentationEquilibree,
    });

    await expectNotBlockedAsClosed(useCase.execute({ repEq: makeDto() }));
    expect(siren).not.toHaveBeenCalled();
  });

  it("lets an open company be declared", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise(undefined) });

    await expectNotBlockedAsClosed(useCase.execute({ repEq: makeDto() }));
  });

  it("lets a non-diffusible company (no dateCessation) be declared", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise(undefined) });

    await expectNotBlockedAsClosed(useCase.execute({ repEq: makeDto() }));
  });

  it("does not report a closed company when the API lookup fails (fail-open)", async () => {
    const siren = jest.fn().mockRejectedValue(new Error("fetch failed"));
    const getOne = jest.fn().mockResolvedValue(null);
    const repo = { getOne, saveWithIndex: jest.fn() } as unknown as IRepresentationEquilibreeRepo;
    const service = { siren } as unknown as IEntrepriseService;
    const useCase = new SaveRepresentationEquilibree(repo, service);

    await expectNotBlockedAsClosed(useCase.execute({ repEq: makeDto() }));
  });
});
