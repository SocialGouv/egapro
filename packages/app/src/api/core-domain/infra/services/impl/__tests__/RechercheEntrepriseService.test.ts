import { Siren } from "@common/core-domain/domain/valueObjects/Siren";

import { RechercheEntrepriseService } from "../RechercheEntrepriseService";

const TEST_SIREN = "384964508";

function mockFetchOnce(body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

describe("RechercheEntrepriseService.siren mapping", () => {
  const service = new RechercheEntrepriseService();
  const siren = new Siren(TEST_SIREN);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses nom_raison_sociale when present", async () => {
    mockFetchOnce({
      results: [
        {
          siren: TEST_SIREN,
          nom_raison_sociale: "RAISON SOCIALE SARL",
          nom_complet: "Raison Sociale SARL — Nom Complet",
        },
      ],
    });

    const entreprise = await service.siren(siren);
    expect(entreprise.simpleLabel).toBe("RAISON SOCIALE SARL");
  });

  it("falls back to nom_complet when nom_raison_sociale is missing", async () => {
    mockFetchOnce({
      results: [
        {
          siren: TEST_SIREN,
          nom_complet: "Nom Complet Only",
        },
      ],
    });

    const entreprise = await service.siren(siren);
    expect(entreprise.simpleLabel).toBe("Nom Complet Only");
  });

  it("falls back to nom_complet when nom_raison_sociale is empty string", async () => {
    mockFetchOnce({
      results: [
        {
          siren: TEST_SIREN,
          nom_raison_sociale: "",
          nom_complet: "Nom Complet Fallback",
        },
      ],
    });

    const entreprise = await service.siren(siren);
    expect(entreprise.simpleLabel).toBe("Nom Complet Fallback");
  });

  it("returns empty simpleLabel when both names are missing", async () => {
    mockFetchOnce({
      results: [
        {
          siren: TEST_SIREN,
        },
      ],
    });

    const entreprise = await service.siren(siren);
    expect(entreprise.simpleLabel).toBe("");
  });
});
