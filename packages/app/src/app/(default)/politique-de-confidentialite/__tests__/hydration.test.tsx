import { expectToHydrateWithoutMismatch } from "@common/utils/__tests__/hydration";

import PrivacyPolicy from "../page";

describe("<PrivacyPolicy /> hydration", () => {
  it("should hydrate the server markup without mismatch", async () => {
    await expectToHydrateWithoutMismatch(<PrivacyPolicy />);
  });
});
