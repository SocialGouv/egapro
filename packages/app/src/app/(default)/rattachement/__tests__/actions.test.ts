/**
 * @jest-environment node
 */
import { assertServerSession } from "@api/utils/auth";
import { UnexpectedSessionError } from "@common/shared-domain";

import { putOwnershipRequest } from "../actions";

const execute = jest.fn();

jest.mock("@api/utils/auth", () => ({ assertServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/mail", () => ({ globalMailerService: {} }));
jest.mock("@api/core-domain/infra/services", () => ({ entrepriseService: {} }));
jest.mock("@api/core-domain/repo", () => ({ ownershipRequestRepo: {} }));
jest.mock("@api/core-domain/useCases/CreateOwnershipRequest", () => ({
  CreateOwnershipRequest: jest.fn().mockImplementation(() => ({ execute })),
}));
jest.mock("@api/core-domain/useCases/UpdateOwnershipRequestStatus", () => ({
  UpdateOwnershipRequestStatus: jest.fn(),
}));

const mockedAssertServerSession = assertServerSession as jest.Mock;

describe("putOwnershipRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("refuses an anonymous caller", async () => {
    mockedAssertServerSession.mockRejectedValue(new UnexpectedSessionError("No session found."));

    await expect(
      putOwnershipRequest({ askerEmail: "victim@test.fr", emails: ["a@test.fr"], sirens: ["123456782"] }),
    ).rejects.toThrow(UnexpectedSessionError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("always uses the logged-in user as the asker, whatever the client sent", async () => {
    mockedAssertServerSession.mockResolvedValue({ user: { email: "me@test.fr" } });

    await putOwnershipRequest({ askerEmail: "victim@test.fr", emails: ["a@test.fr"], sirens: ["123456782"] });

    expect(execute).toHaveBeenCalledWith({ askerEmail: "me@test.fr", emails: ["a@test.fr"], sirens: ["123456782"] });
  });
});
