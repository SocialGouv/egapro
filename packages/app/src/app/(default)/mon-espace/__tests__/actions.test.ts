/**
 * @jest-environment node
 */
import { ownershipRepo } from "@api/core-domain/repo";
import { assertServerSession } from "@api/utils/auth";
import { UnexpectedSessionError } from "@common/shared-domain";

import { addSirens, removeSirens } from "../actions";

jest.mock("@api/utils/auth", () => ({ assertServerSession: jest.fn() }));
jest.mock("@api/core-domain/repo", () => ({
  declarationRepo: {},
  representationEquilibreeRepo: {},
  ownershipRepo: { addSirens: jest.fn(), removeSirens: jest.fn() },
}));

const OWNED = "384964508";

describe("addSirens / removeSirens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (assertServerSession as jest.Mock).mockResolvedValue({
      user: { email: "owner@test.fr", staff: false, companies: [{ siren: OWNED, label: null }] },
    });
  });

  it("records the session user in the audit log, whatever the client sends", async () => {
    // A client could still pass a third argument: it must be ignored.
    await (addSirens as (...args: unknown[]) => Promise<unknown>)("new@test.fr", [OWNED], "victim@test.fr");
    await (removeSirens as (...args: unknown[]) => Promise<unknown>)("old@test.fr", [OWNED], "victim@test.fr");

    expect((ownershipRepo.addSirens as jest.Mock).mock.calls[0][2]).toBe("owner@test.fr");
    expect((ownershipRepo.removeSirens as jest.Mock).mock.calls[0][2]).toBe("owner@test.fr");
  });

  it("refuses a siren the user does not own", async () => {
    await expect(addSirens("new@test.fr", ["552100554"])).rejects.toThrow(UnexpectedSessionError);
    expect(ownershipRepo.addSirens).not.toHaveBeenCalled();
  });
});
