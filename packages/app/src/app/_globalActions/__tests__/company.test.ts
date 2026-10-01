/**
 * @jest-environment node
 */
import { assertServerSession } from "@api/utils/auth";
import { UnexpectedSessionError } from "@common/shared-domain";

import { getCompany } from "../company";
import { CompanyErrorCodes } from "../companyErrorCodes";

const siren = jest.fn();

jest.mock("@api/utils/auth", () => ({ assertServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/services", () => ({ entrepriseService: { siren: (s: unknown) => siren(s) } }));

const mockedAssertServerSession = assertServerSession as jest.Mock;

describe("getCompany", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    siren.mockImplementation(async (s: { getValue: () => string }) => ({ siren: s.getValue() }));
  });

  it("answers an anonymous or expired session with ok: false instead of rejecting", async () => {
    mockedAssertServerSession.mockRejectedValue(new UnexpectedSessionError("No session found."));

    await expect(getCompany("123456782")).resolves.toEqual({ ok: false, error: CompanyErrorCodes.UNKNOWN });
    expect(siren).not.toHaveBeenCalled();
  });

  it("keeps several sirens in cache, not only the last one", async () => {
    mockedAssertServerSession.mockResolvedValue({ user: { email: "me@test.fr" } });

    await getCompany("987654324");
    await getCompany("111111118");
    await getCompany("987654324");

    expect(siren).toHaveBeenCalledTimes(2);
  });
});
