/**
 * @jest-environment node
 */
import { assertServerSession } from "@api/utils/auth";
import { UnexpectedSessionError } from "@common/shared-domain";

import { saveDeclaration } from "../actions";

const execute = jest.fn();

jest.mock("@api/utils/auth", () => ({ assertServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/mail", () => ({ globalMailerService: {} }));
jest.mock("@api/core-domain/infra/services", () => ({ entrepriseService: {} }));
jest.mock("@api/core-domain/repo", () => ({ declarationRepo: {}, referentRepo: {} }));
jest.mock("@api/shared-domain/infra/pdf", () => ({ jsxPdfService: {} }));
jest.mock("@api/core-domain/useCases/SaveDeclaration", () => ({
  SaveDeclaration: jest.fn().mockImplementation(() => ({ execute })),
}));
jest.mock("@api/core-domain/useCases/SendDeclarationReceipt", () => ({
  SendDeclarationReceipt: jest.fn().mockImplementation(() => ({ execute: jest.fn().mockResolvedValue(undefined) })),
}));

const OWNED = "384964508";
const VICTIM = "552100554";

const dto = (commencerSiren: string, declaringSiren: string) =>
  ({
    commencer: { siren: commencerSiren, annéeIndicateurs: 2024 },
    entreprise: { entrepriseDéclarante: { siren: declaringSiren } },
  }) as never;

describe("saveDeclaration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The logged-in user owns OWNED only.
    (assertServerSession as jest.Mock).mockImplementation(async ({ owner }: { owner?: { check: string } } = {}) => {
      if (owner && owner.check !== OWNED) throw new UnexpectedSessionError("You are not owner of the provided Siren.");
      return { user: { staff: false, email: "me@test.fr" } };
    });
  });

  it("checks ownership of the company the declaration is saved under, not only commencer.siren", async () => {
    await expect(saveDeclaration(dto(OWNED, VICTIM))).rejects.toThrow(UnexpectedSessionError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("saves a declaration of an owned company", async () => {
    await expect(saveDeclaration(dto(OWNED, OWNED))).resolves.toEqual({ ok: true });
    expect(execute).toHaveBeenCalled();
  });
});
