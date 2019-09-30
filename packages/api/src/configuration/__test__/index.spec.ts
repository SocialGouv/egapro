//

import { getConfiguration } from "../configs";

const validEnv = {
  API_PORT: "123456",
  API_SENTRY_DSN: "API_SENTRY_DSN",
  API_SENTRY_ENABLED: "true",
  KINTO_BUCKET: "KINTO_BUCKET",
  KINTO_LOGIN: "KINTO_LOGIN",
  KINTO_PASSWORD: "KINTO_PASSWORD",
  KINTO_SERVER: "KINTO_SERVER",
  MAIL_FROM: "MAIL_FROM",
  MAIL_HOST: "MAIL_HOST",
  MAIL_PASSWORD: "MAIL_PASSWORD",
  MAIL_PORT: "465",
  MAIL_USERNAME: "MAIL_USERNAME",
  MAIL_USE_TLS: "true"
};

it("should return the env configuration", () => {
  expect(getConfiguration(validEnv)).toMatchInlineSnapshot(`
    Object {
      "apiPort": 123456,
      "apiSentryDSN": "API_SENTRY_DSN",
      "apiSentryEnabled": true,
      "kintoBucket": "KINTO_BUCKET",
      "kintoLogin": "KINTO_LOGIN",
      "kintoPassword": "KINTO_PASSWORD",
      "kintoURL": "http://KINTO_SERVER:8888/v1",
      "mailFrom": "MAIL_FROM",
      "mailHost": "MAIL_HOST",
      "mailPassword": "MAIL_PASSWORD",
      "mailPort": 465,
      "mailUseTLS": true,
      "mailUsername": "MAIL_USERNAME",
    }
  `);
});
