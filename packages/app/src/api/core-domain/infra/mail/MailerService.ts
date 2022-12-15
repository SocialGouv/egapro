import { config } from "@common/config";
import type { SendMailOptions } from "nodemailer";

import { defaultSendMailConfig, mailer } from "./nodemailer";
import * as template from "./template";

export const sendMail = async <T extends keyof typeof template>(
  tpl: T,
  options: SendMailOptions,
  ...args: Parameters<typeof template[T]>
) => {
  // eslint-disable-next-line import/namespace -- dynamic
  const generated = template[tpl].call(null, ...args);
  if (!config.api.mailer.enable) {
    return console.debug("Sending mail", { options, text: generated.text });
  }

  const info = await mailer.sendMail({
    ...defaultSendMailConfig,
    ...generated,
    ...options,
  });

  info.
};
