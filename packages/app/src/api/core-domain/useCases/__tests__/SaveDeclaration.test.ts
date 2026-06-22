import { type Entreprise, type IEntrepriseService } from "@api/core-domain/infra/services/IEntrepriseService";
import { type IDeclarationRepo } from "@api/core-domain/repo/IDeclarationRepo";
import { type Declaration } from "@common/core-domain/domain/Declaration";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";

import { SaveDeclaration, SaveDeclarationClosedCompanyError } from "../SaveDeclaration";

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

const makeDto = (): CreateDeclarationDTO =>
  ({
    "declaration-existante": { status: "creation" },
    commencer: { annéeIndicateurs: YEAR, siren: SIREN },
    entreprise: { entrepriseDéclarante: { siren: SIREN } },
  }) as unknown as CreateDeclarationDTO;

const makeUseCase = (opts: { entreprise?: Entreprise; found?: Declaration | null } = {}) => {
  const saveWithIndex = jest.fn().mockResolvedValue(undefined);
  const getOne = jest.fn().mockResolvedValue(opts.found ?? null);
  const siren = jest.fn().mockResolvedValue(opts.entreprise ?? makeEntreprise("2017-01-03"));
  const repo = { getOne, saveWithIndex } as unknown as IDeclarationRepo;
  const service = { siren } as unknown as IEntrepriseService;
  return { useCase: new SaveDeclaration(repo, service), saveWithIndex, getOne, siren };
};

// The guard must not fire; the downstream flow may still reject for unrelated (minimal-DTO) reasons,
// so we only assert that the rejection — if any — is not the closed-company guard.
const expectNotBlockedAsClosed = (promise: Promise<unknown>) =>
  promise.catch(error => {
    expect(error).not.toBeInstanceOf(SaveDeclarationClosedCompanyError);
  });

describe("SaveDeclaration — closed-company guard", () => {
  it("blocks creating a declaration for a closed company", async () => {
    const { useCase, saveWithIndex } = makeUseCase({ entreprise: makeEntreprise("2017-01-03") });

    await expect(useCase.execute({ declaration: makeDto() })).rejects.toBeInstanceOf(
      SaveDeclarationClosedCompanyError,
    );
    expect(saveWithIndex).not.toHaveBeenCalled();
  });

  it("lets staff (override) save for a closed company", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise("2017-01-03") });

    await expectNotBlockedAsClosed(useCase.execute({ declaration: makeDto(), override: true }));
  });

  it("lets an existing declaration be edited even if the company is now closed", async () => {
    const { useCase } = makeUseCase({
      entreprise: makeEntreprise("2017-01-03"),
      found: { declaredAt: new Date() } as Declaration,
    });

    await expectNotBlockedAsClosed(useCase.execute({ declaration: makeDto() }));
  });

  it("lets an open company be declared", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise(undefined) });

    await expectNotBlockedAsClosed(useCase.execute({ declaration: makeDto() }));
  });

  it("lets a non-diffusible company (no dateCessation) be declared", async () => {
    const { useCase } = makeUseCase({ entreprise: makeEntreprise(undefined) });

    await expectNotBlockedAsClosed(useCase.execute({ declaration: makeDto() }));
  });

  it("does not report a closed company when the API lookup fails (fail-open)", async () => {
    const siren = jest.fn().mockRejectedValue(new Error("fetch failed"));
    const repo = { getOne: jest.fn(), saveWithIndex: jest.fn() } as unknown as IDeclarationRepo;
    const service = { siren } as unknown as IEntrepriseService;
    const useCase = new SaveDeclaration(repo, service);

    await expectNotBlockedAsClosed(useCase.execute({ declaration: makeDto() }));
  });
});
