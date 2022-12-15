import { config } from "@common/config";
import { renderToStaticMarkup } from "react-dom/server";

export type MailTemplate = {
  html: string;
  subject: string;
  text: string;
};

export const ownershipRequest_toAskerAfterValidation = (emails: string[], sirens: string[]): MailTemplate => ({
  subject: "Votre demande d'ajout de déclarants a été acceptée",
  text: `Bonjour,

Les emails suivants ont été ajoutés aux numéros Siren de vos entreprises :
Emails :
${emails.map(email => `- ${email}`).join("\n")}

Numéros Siren :
${sirens.map(siren => `- ${siren}`).join("\n")}

Cordialement,

${config.api.mailer.signature}`,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <body>
          <p>Bonjour,</p>
          <p>Les emails suivants ont été ajoutés aux numéros Siren de vos entreprises :</p>
          <p>
            <h3>Emails :</h3>
            <ul>
              {emails.map((email, idx) => (
                <li key={`email-${idx}`}>{email}</li>
              ))}
            </ul>
          </p>
          <p>
            <h3>Numéros Siren :</h3>
            <ul>
              {sirens.map((siren, idx) => (
                <li key={`siren-${idx}`}>{siren}</li>
              ))}
            </ul>
          </p>
          <p>Cordialement,</p>
          <p>{config.api.mailer.signature}</p>
        </body>
      </html>,
    ),
});
