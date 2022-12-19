import type { Any, SimpleObject } from "@common/utils/types";
import type { SendMailOptions } from "nodemailer";

import type { MailTemplate } from "./type";

export type Templates = SimpleObject<(...args: Any[]) => MailTemplate>;

/**
 * Generic mailer service interface. Implement it for a specific domain.
 *
 * A mailer service should always relies on a group of domain's {@link Templates} to offer auto complete.
 */
export interface IMailerService<TTemplate extends Templates> {
  /**
   * Prepare the service. e.g. Preload the internal mailer lib.
   */
  init(): Promise<void>;

  /**
   * Send an email based on the given template.
   *
   * @returns A tuple of recipients accepted and rejected from the server.
   */
  sendMail<T extends keyof TTemplate>(
    tpl: T,
    // TODO do not use specific "nodemailer" type
    options: SendMailOptions,
    ...args: Parameters<TTemplate[T]>
  ): Promise<[accepted: string[], rejected: string[]]>;
}
