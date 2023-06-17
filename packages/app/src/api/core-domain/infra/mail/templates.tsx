import { type MailTemplate } from "@api/shared-domain/infra/mail/type";
import { config } from "@common/config";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Nextjs don't like react-dom/server on routes, so we should "hide it" from him by using require instead of import
const { renderToStaticMarkup } = require("react-dom/server");

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

export const login_sendVerificationUrl = (url: string): MailTemplate => ({
  subject: "Egapro - Vérification de l'email",
  text: `Bonjour,

Voici le lien vous permettant de valider votre email :

${url}

Cordialement,

${config.api.mailer.signature}`,

  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <body>
          <p>Bonjour,</p>
          <p>Voici le lien vous permettant de valider votre email :</p>
          <p>
            <a href={url}>{url}</a>
          </p>
          <p>Cordialement,</p>
          <p>{config.api.mailer.signature}</p>
        </body>
      </html>,
    ),
});

export const balancedRepresentation_receipt = (url: string, year: number): MailTemplate => ({
  subject: "Egapro - Déclaration des écarts éventuels de représentation femmes-hommes dans les postes de direction",
  text: `Madame, Monsieur,

Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos écarts éventuels de représentation entre les femmes et les hommes pour l'année ${
    year + 1
  } au titre des données ${year}. L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé réception ne vaut pas contrôle de conformité de votre déclaration.

Si vous souhaitez visualiser ou modifier votre déclaration, veuillez cliquer sur le lien suivant :

${url}

Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées,

Les services de l’administration du travail.
`,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <body>
          <p>Madame, Monsieur,</p>
          <p>
            Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos écarts éventuels
            de représentation entre les femmes et les hommes pour l'année {year + 1} au titre des données {year}.
            L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé
            réception ne vaut pas contrôle de conformité de votre déclaration.
          </p>
          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration, veuillez cliquer sur le lien suivant :{" "}
            <a href={url}>{url}</a>
          </p>
          <p>
            Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au
            sein de votre DREETS en répondant à ce message.
          </p>
          <p>Veuillez agréer, Madame, Monsieur, nos salutations distinguées,</p>
          <p>Les services de l’administration du travail</p>
        </body>
      </html>,
    ),
});
