/**
 * @jest-environment node
 */
import { declarationRepo } from "@api/core-domain/repo";
import { assertServerSession } from "@api/utils/auth";

import { updateCompanyInfos } from "../actions";

const execute = jest.fn();

jest.mock("@api/utils/auth", () => ({ assertServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/services", () => ({ entrepriseService: {} }));
jest.mock("@api/core-domain/repo", () => ({ declarationRepo: { delete: jest.fn() } }));
jest.mock("@api/core-domain/useCases/SaveDeclaration", () => ({
  SaveDeclaration: jest.fn().mockImplementation(() => ({ execute })),
}));

const declaration = (siren: string) => ({ commencer: { siren, annéeIndicateurs: 2024 } }) as never;

describe("updateCompanyInfos (declaration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (assertServerSession as jest.Mock).mockResolvedValue({ user: { staff: false } });
  });

  it("does not delete the declaration it just saved when the SIREN is unchanged", async () => {
    await expect(updateCompanyInfos(declaration("123456782"), "123456782")).resolves.toEqual({ ok: true });

    expect(execute).toHaveBeenCalled();
    expect(declarationRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes the declaration of the old SIREN when the SIREN changed", async () => {
    await updateCompanyInfos(declaration("123456782"), "552100554");

    expect(assertServerSession).toHaveBeenCalledWith(
      expect.objectContaining({ owner: expect.objectContaining({ check: "552100554" }) }),
    );
    expect(declarationRepo.delete).toHaveBeenCalledTimes(1);
    const [[[siren]]] = (declarationRepo.delete as jest.Mock).mock.calls;
    expect(siren.getValue()).toBe("552100554");
  });
});
