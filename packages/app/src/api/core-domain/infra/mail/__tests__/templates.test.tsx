import { login_sendVerificationUrl } from "../templates";

describe("mail ministry branding", () => {
  it("labels the current ministry logo in the rendered email header", () => {
    const template = login_sendVerificationUrl("https://egapro.test/verify");

    expect(template.html).toContain('alt="Ministère du Travail et des Solidarités"');
    expect(template.html).toContain("/logo-ministere.generated.png");
  });
});
