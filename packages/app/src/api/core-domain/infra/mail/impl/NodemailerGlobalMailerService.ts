import type { Templates } from "@api/shared-domain/infra/mail/IMailerService";
import { defaultSendMailConfig, mailer, verifyMailerConnection } from "@api/shared-domain/infra/mail/nodemailer";
import { config } from "@common/config";
import { UnexpectedError, UnexpectedMailerError } from "@common/shared-domain";
import { isNodeErrorNoException } from "@common/utils/error";
import type { SendMailOptions } from "nodemailer";
import type { Options } from "nodemailer/lib/mailer";
import { getSystemErrorName } from "util";

import type { IGlobalMailerService } from "../IGlobalMailerService";

export class NodemailerGlobalMailerService implements IGlobalMailerService {
  constructor(private readonly templates: Templates) {}

  public async init(): Promise<void> {
    if (!config.api.mailer.enable) return;
    try {
      await verifyMailerConnection();
    } catch (error: unknown) {
      if (isNodeErrorNoException(error) && getSystemErrorName(error.errno) === "ECONNREFUSED") {
        throw new UnexpectedMailerError("Mailer service could not connect properly.", error);
      }
      throw new UnexpectedError("Mailer service is broken for some reason.", error as Error);
    }
  }

  public async sendMail<T extends keyof Templates>(
    tpl: T,
    options: Options,
    ...args: Parameters<Templates[T]>
  ): Promise<[accepted: string[], rejected: string[]]> {
    const generated = this.templates[tpl].call(null, ...args);
    if (!config.api.mailer.enable || !mailer) {
      console.debug("Sending mail", { options, text: generated.text });
      return [handleRecipients(options.to), []];
    }

    try {
      const info = await mailer.sendMail({
        ...defaultSendMailConfig,
        ...generated,
        ...options,
      });

      return [handleRecipients(info.accepted), handleRecipients(info.rejected)];
    } catch (error: unknown) {
      console.error(error);
      return [[], handleRecipients(options.to)];
    }
  }
}

const handleRecipients = (recipients: SendMailOptions["to"]): string[] => {
  let ret = [] as string[];
  if (!recipients) return [];

  if (typeof recipients === "string") {
    ret = [recipients];
  } else if (Array.isArray(recipients)) {
    for (const acceptedElt of recipients) {
      if (typeof acceptedElt === "string") {
        ret.push(acceptedElt);
      } else {
        ret.push(acceptedElt.address);
      }
    }
  } else {
    ret = [recipients?.address];
  }

  return ret;
};
