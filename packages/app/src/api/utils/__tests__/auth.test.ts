/**
 * @jest-environment node
 */
import { UnexpectedSessionError } from "@common/shared-domain";
import { getServerSession } from "next-auth";

import { assertServerSession } from "../auth";

jest.mock("server-only", () => ({}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/auth/config", () => ({ authConfig: {} }));

const mockedGetServerSession = getServerSession as jest.Mock;

const session = ({ staff = false, sirens = ["123456782"] }: { sirens?: string[]; staff?: boolean } = {}) => ({
  user: { email: "u@test.fr", staff, companies: sirens.map(siren => ({ siren, label: null })) },
});

describe("assertServerSession", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    await expect(assertServerSession()).rejects.toThrow(UnexpectedSessionError);
  });

  it("returns the session when no check is asked", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    await expect(assertServerSession()).resolves.toMatchObject({ user: { email: "u@test.fr" } });
  });

  describe.each([
    ["owner as a string", (siren: string) => ({ owner: siren })],
    ["owner as { check }", (siren: string) => ({ owner: { check: siren } })],
  ])("%s", (_, params) => {
    it("lets the owner of the siren pass", async () => {
      mockedGetServerSession.mockResolvedValue(session());
      await expect(assertServerSession(params("123456782"))).resolves.toBeTruthy();
    });

    it("rejects a user who does not own the siren", async () => {
      mockedGetServerSession.mockResolvedValue(session());
      await expect(assertServerSession(params("999999999"))).rejects.toThrow(UnexpectedSessionError);
    });

    it("fails closed on an empty siren instead of skipping the check", async () => {
      mockedGetServerSession.mockResolvedValue(session({ sirens: [""] }));
      await expect(assertServerSession(params(""))).rejects.toThrow(UnexpectedSessionError);
    });

    it("lets staff pass", async () => {
      mockedGetServerSession.mockResolvedValue(session({ staff: true, sirens: [] }));
      await expect(assertServerSession(params("999999999"))).resolves.toBeTruthy();
    });
  });

  it("owner or staff: rejects a non-owner non-staff user", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    await expect(assertServerSession({ owner: { check: "999999999" }, staff: true })).rejects.toThrow(
      "You are not owner of the provided Siren.",
    );
  });

  it("staff only: rejects a non-staff user, even an owner", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    await expect(assertServerSession({ staff: true })).rejects.toThrow("You are not staff.");
  });
});
