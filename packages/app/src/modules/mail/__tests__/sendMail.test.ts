import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
	default: {
		createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
	},
	createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
}));

function mockEnv(enabled: boolean) {
	vi.doMock("~/env.js", () => ({
		env: {
			MAIL_ENABLED: enabled,
			SMTP_HOST: "localhost",
			SMTP_PORT: 1025,
			MAIL_FROM: "no-reply@test",
			SMTP_USER: undefined,
			SMTP_PASS: undefined,
		},
	}));
}

describe("sendMail", () => {
	beforeEach(() => {
		sendMailMock.mockReset();
		vi.resetModules();
	});

	it("returns disabled when MAIL_ENABLED is false", async () => {
		mockEnv(false);
		const { sendMail } = await import("../sendMail");
		const result = await sendMail({
			to: "a@b.fr",
			subject: "s",
			text: "t",
			html: "<p>t</p>",
		});
		expect(result).toEqual({ status: "disabled" });
		expect(sendMailMock).not.toHaveBeenCalled();
	});

	it("sends the email when enabled", async () => {
		mockEnv(true);
		sendMailMock.mockResolvedValue({ messageId: "msg-1" });
		const { sendMail } = await import("../sendMail");
		const result = await sendMail({
			to: "a@b.fr",
			subject: "s",
			text: "t",
			html: "<p>t</p>",
		});
		expect(result).toEqual({ status: "sent", messageId: "msg-1" });
		expect(sendMailMock).toHaveBeenCalledWith({
			from: "no-reply@test",
			to: "a@b.fr",
			subject: "s",
			text: "t",
			html: "<p>t</p>",
			attachments: undefined,
		});
	});

	it("returns error status when transporter throws", async () => {
		mockEnv(true);
		sendMailMock.mockRejectedValue(new Error("smtp down"));
		const { sendMail } = await import("../sendMail");
		const result = await sendMail({
			to: "a@b.fr",
			subject: "s",
			text: "t",
			html: "<p>t</p>",
		});
		expect(result).toEqual({ status: "error", error: "smtp down" });
	});

	it("forwards attachments", async () => {
		mockEnv(true);
		sendMailMock.mockResolvedValue({ messageId: "msg" });
		const { sendMail } = await import("../sendMail");
		await sendMail({
			to: "a@b.fr",
			subject: "s",
			text: "t",
			html: "<p>t</p>",
			attachments: [
				{
					filename: "f.pdf",
					content: Buffer.from("pdf"),
					contentType: "application/pdf",
				},
			],
		});
		expect(sendMailMock.mock.calls[0]?.[0].attachments).toEqual([
			{
				filename: "f.pdf",
				content: Buffer.from("pdf"),
				contentType: "application/pdf",
			},
		]);
	});
});
