import type { MailTemplate } from "@api/shared-domain/infra/mail/type";
import { config } from "@common/config";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

export const ownershipRequest_toAskerAfterValidation = (
  combo: Array<[email: string, siren: string]>,
): MailTemplate => ({
  subject: "Egapro - Votre demande d'ajout de déclarants a été acceptée",
  text: `Bonjour,

Les emails suivants ont été ajoutés aux numéros Siren de vos entreprises :
${combo.map(([email, siren]) => `- ${email} => ${siren}`).join("\n")}

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
            <ul>
              {combo.map(([email, siren], idx) => (
                <li key={`combo-${idx}`}>
                  {email} =&gt; {siren}
                </li>
              ))}
            </ul>
          </p>
          <p>Cordialement,</p>
          <p>{config.api.mailer.signature}</p>
        </body>
      </html>,
    ),
});

export const ownershipRequest_toAskerAfterRejection = (combo: Array<[email: string, siren: string]>): MailTemplate => ({
  subject: "Egapro - Votre demande d'ajout de déclarants a été refusée",
  text: `Bonjour,

Les emails suivants ont été refusés et n'ont donc pas été ajoutés aux numéros Siren de vos entreprises :
${combo.map(([email, siren]) => `- ${email} => ${siren}`).join("\n")}

Cordialement,

${config.api.mailer.signature}`,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <body>
          <p>Bonjour,</p>
          <p>
            Les emails suivants ont été refusés et n'ont donc pas été ajoutés aux numéros Siren de vos entreprises :
          </p>
          <p>
            <ul>
              {combo.map(([email, siren], idx) => (
                <li key={`combo-${idx}`}>
                  {email} =&gt; {siren}
                </li>
              ))}
            </ul>
          </p>
          <p>Cordialement,</p>
          <p>{config.api.mailer.signature}</p>
        </body>
      </html>,
    ),
});

export const ownershipRequest_toDeclarantAfterValidation = (email: string, siren: string): MailTemplate => ({
  subject: "Egapro - Vous avez été ajouté en tant que déclarant",
  attachments: [
    {
      path: path.resolve(process.cwd(), "public/Procedure.pour.ajouter.ou.supprimer.declarants.pdf"),
    },
  ],
  text: `Bonjour,

L'email ${email} a été ajouté au numéro Siren ${siren} de votre entreprise.

Vous avez maintenant la main pour ajouter un nouveau déclarant ou supprimer un déclarant en vous connectant à votre espace, avec cet email, vous trouverez ci-joint la documentation pour le faire.

Cordialement,

${config.api.mailer.signature}`,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <body>
          <p>Bonjour,</p>
          <p>
            L'email {email} a été ajouté au numéro Siren {siren} de votre entreprise.
          </p>
          <p>
            Vous avez maintenant la main pour ajouter un nouveau déclarant ou supprimer un déclarant en vous connectant
            à votre espace, avec cet email, vous trouverez ci-joint la documentation pour le faire.
          </p>
          <p>Cordialement,</p>
          <p>{config.api.mailer.signature}</p>
        </body>
      </html>,
    ),
});
