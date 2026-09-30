/**
 * @jest-environment node
 */
import { getServerSession } from "next-auth";

import { GET } from "../route";

const execute = jest.fn();

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@api/core-domain/infra/auth/config", () => ({ authConfig: {} }));
jest.mock("@api/core-domain/repo", () => ({}));
jest.mock("@api/shared-domain/infra/pdf", () => ({ jsxPdfService: {} }));
jest.mock("@api/core-domain/useCases/DownloadRepresentationEquilibreeReceipt", () => ({
  DownloadRepresentationEquilibreeReceipt: jest.fn().mockImplementation(() => ({ execute })),
  DownloadRepresentationEquilibreeReceiptError: class extends Error {},
}));

const mockedGetServerSession = getServerSession as jest.Mock;

const get = (siren = "123456782") =>
  GET(new Request("https://app.test/pdf") as never, { params: { siren, year: "2024" } });

const session = ({ staff = false, sirens = ["123456782"] }: { sirens?: string[]; staff?: boolean } = {}) => ({
  user: { email: "u@test.fr", staff, companies: sirens.map(siren => ({ siren, label: null })) },
});

describe("receipt PDF route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue(Buffer.from("%PDF"));
  });

  it("answers 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const res = await get();

    expect(res.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("answers 403 to a user who does not own the siren", async () => {
    mockedGetServerSession.mockResolvedValue(session({ sirens: ["999999999"] }));

    const res = await get();

    expect(res.status).toBe(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it("serves the PDF to an owner of the siren", async () => {
    mockedGetServerSession.mockResolvedValue(session());

    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(execute).toHaveBeenCalledWith({ siren: "123456782", year: 2024 });
  });

  it("serves the PDF to staff", async () => {
    mockedGetServerSession.mockResolvedValue(session({ staff: true, sirens: [] }));

    const res = await get();

    expect(res.status).toBe(200);
  });
});
