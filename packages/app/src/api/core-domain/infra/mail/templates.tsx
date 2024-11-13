/* eslint-disable react/forbid-dom-props */
import { type MailTemplate } from "@api/shared-domain/infra/mail/type";
import { config } from "@common/config";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Nextjs don't like react-dom/server on routes, so we should "hide it" from him by using require instead of import
const { renderToStaticMarkup } = require("react-dom/server");

const MailHeader = () => (
  <header style={{ display: "flex", alignItems: "center", marginBottom: "20px", fontFamily: "arial, sans-serif" }}>
    <img
      src={`${config.host}/logo-ministere.png`}
      alt="Egapro Logo"
      style={{ maxWidth: "150px", marginRight: "20px" }}
    />
    <div>
      <h1 style={{ margin: 0, fontSize: "24px" }}>Egapro</h1>
      <p style={{ margin: 0, fontSize: "16px", color: "#666" }}>
        Index de l’égalité professionnelle et représentation équilibrée femmes‑hommes
      </p>
    </div>
  </header>
);

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
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
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
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
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
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
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
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
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

export const declaration_receipt = (url: string, { declaration }: DeclarationOpmc, host: string): MailTemplate => ({
  subject: "Egapro - Déclaration de l’index égalité professionnelle femmes-hommes",
  text: `Madame, Monsieur,

Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos indicateurs et de votre niveau de résultat en matière d’écart de rémunération entre les femmes et les hommes pour l'année ${
    declaration.year.getValue() + 1
  } au titre des données ${declaration.year.getValue()} conformément aux dispositions de l’article D.1142-5 du code du travail. L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.

Vous avez déclaré un index de l'égalité professionnelle ${
    declaration.index?.getValue() ? `de ${declaration.index.getValue()}` : "non calculable"
  }, décliné par indicateurs comme suit :

- indicateur écart de rémunération : ${
    declaration.remunerations?.score?.getValue() === undefined
      ? "non calculable"
      : declaration.remunerations.score.getValue()
  }
${
  declaration.company.range?.getValue() == CompanyWorkforceRange.Enum.FROM_50_TO_250
    ? `- indicateur écart de taux d'augmentations : ${
        declaration.salaryRaisesAndPromotions?.score?.getValue() === undefined
          ? "non calculable"
          : declaration.salaryRaisesAndPromotions.score.getValue()
      }`
    : `- indicateur écart de taux d'augmentations : ${
        declaration.salaryRaises?.score?.getValue() === undefined
          ? "non calculable"
          : declaration.salaryRaises.score.getValue()
      }
- indicateur écart de taux de promotions : ${
        declaration.promotions?.score?.getValue() === undefined
          ? "non calculable"
          : declaration.promotions.score.getValue()
      }`
}
- indicateur retour de congé maternité : ${
    declaration.maternityLeaves?.score?.getValue() === undefined
      ? "non calculable"
      : declaration.maternityLeaves.score.getValue()
  }}
- indicateur hautes rémunérations: ${
    declaration.highRemunerations?.score?.getValue() === undefined
      ? "non calculable"
      : declaration.highRemunerations.score.getValue()
  }}

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
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
          <p>Madame, Monsieur,</p>

          <p>
            Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos indicateurs et de
            votre niveau de résultat en matière d’écart de rémunération entre les femmes et les hommes pour l'année{" "}
            {declaration.year.getValue() + 1} au titre des données {declaration.year.getValue()} conformément aux
            dispositions de l’article D.1142-5 du code du travail. L’administration du travail accuse réception par le
            présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de
            votre déclaration.
          </p>

          <p>
            Vous avez déclaré un index de l'égalité professionnelle{" "}
            {declaration.index?.getValue() ? `de ${declaration.index.getValue()}` : "non calculable"}, décliné par
            indicateurs comme suit :
          </p>

          <ul>
            <li>
              indicateur écart de rémunération :{" "}
              {declaration.remunerations?.score?.getValue() === undefined
                ? "non calculable"
                : declaration.remunerations.score.getValue()}
            </li>

            {declaration.company.range?.getValue() == CompanyWorkforceRange.Enum.FROM_50_TO_250 ? (
              <li>
                indicateur écart de taux d'augmentations :{" "}
                {declaration.salaryRaisesAndPromotions?.score?.getValue() === undefined
                  ? "non calculable"
                  : declaration.salaryRaisesAndPromotions.score.getValue()}
              </li>
            ) : (
              <>
                <li>
                  indicateur écart de taux d'augmentations :{" "}
                  {declaration.salaryRaises?.score?.getValue() === undefined
                    ? "non calculable"
                    : declaration.salaryRaises.score.getValue()}
                </li>
                <li>
                  indicateur écart de taux de promotions :{" "}
                  {declaration.promotions?.score?.getValue() === undefined
                    ? "non calculable"
                    : declaration.promotions.score.getValue()}
                </li>
              </>
            )}
            <li>
              indicateur retour de congé maternité :{" "}
              {declaration.maternityLeaves?.score?.getValue() === undefined
                ? "non calculable"
                : declaration.maternityLeaves.score.getValue()}
            </li>
            <li>
              indicateur hautes rémunérations:{" "}
              {declaration.highRemunerations?.score?.getValue() === undefined
                ? "non calculable"
                : declaration.highRemunerations.score.getValue()}
            </li>
          </ul>

          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration, veuillez cliquer sur le lien suivant :{" "}
            <a href={url}>{url}</a>
          </p>
          <p>
            Vos déclarations transmises sont disponibles dans votre espace personnel sur le site Egapro, menu "Mes
            déclarations" : <a href={`${host}/mon-espace/mes-declarations`}>Accéder à mon espace</a>
          </p>
          <p>
            Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au
            sein de votre DREETS en répondant à ce message.
          </p>

          <p>Veuillez agréer, Madame, Monsieur, nos salutations distinguées,</p>

          <p>Les services de l’administration du travail.</p>
        </body>
      </html>,
    ),
});

export const opmc_receipt = (): MailTemplate => ({
  subject:
    "Egapro - Déclaration des objectifs de progression et mesures de correction de l’index égalité professionnelle femmes-hommes",
  text: `Madame, Monsieur,

Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos objectifs de progression et mesures de correction. L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.

Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées,

Les services de l’administration du travail.
  `,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
          <p>Madame, Monsieur,</p>

          <p>
            Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos objectifs de
            progression et mesures de correction. L’administration du travail accuse réception par le présent message de
            votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.
          </p>
          <p>
            Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au
            sein de votre DREETS en répondant à ce message.
          </p>
          <p>Veuillez agréer, Madame, Monsieur, nos salutations distinguées,</p>
          <p>Les services de l’administration du travail.</p>
        </body>
      </html>,
    ),
});

export const op_receipt = (): MailTemplate => ({
  subject: "Egapro - Déclaration des objectifs de progression de l’index égalité professionnelle femmes-homme",
  text: `Madame, Monsieur,

Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos objectifs de progression. L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.

Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées,

Les services de l’administration du travail.
  `,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
          <p>Madame, Monsieur,</p>

          <p>
            Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos objectifs de
            progression. L’administration du travail accuse réception par le présent message de votre due transmission.
            Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.
          </p>
          <p>
            Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au
            sein de votre DREETS en répondant à ce message.
          </p>
          <p>Veuillez agréer, Madame, Monsieur, nos salutations distinguées,</p>
          <p>Les services de l’administration du travail.</p>
        </body>
      </html>,
    ),
});

export const balancedRepresentation_receipt = (url: string, year: number, host: string): MailTemplate => ({
  subject: "Egapro - Déclaration des écarts éventuels de représentation femmes‑hommes dans les postes de direction",
  text: `Madame, Monsieur,

Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos écarts éventuels de représentation entre les femmes et les hommes pour l'année ${
    year + 1
  } au titre des données ${year}. L’administration du travail accuse réception par le présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre déclaration.

Si vous souhaitez visualiser ou modifier votre déclaration, veuillez cliquer sur le lien suivant :

${url}

Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes‑hommes au sein de votre DREETS en répondant à ce message.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées,

Les services de l’administration du travail.
`,
  html:
    "<!doctype html>" +
    renderToStaticMarkup(
      <html>
        <MailHeader />
        <body style={{ fontFamily: "arial, sans-serif" }}>
          <p>Madame, Monsieur,</p>
          <p>
            Vous venez de procéder à la transmission aux services du ministre chargé du travail de vos écarts éventuels
            de représentation entre les femmes et les hommes pour l'année {year + 1} au titre des données {year}{" "}
            conformément aux dispositions de l’article D.1142-19 du code du travail. L’administration du travail accuse
            réception par le présent message de votre due transmission. Cet accusé de réception ne vaut pas contrôle de
            conformité de votre déclaration.
          </p>
          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration, veuillez cliquer sur le lien suivant :{" "}
            <a href={url}>{url}</a>
          </p>
          <p>
            Vos déclarations transmises sont disponibles dans votre espace personnel sur le site Egapro, menu "Mes
            déclarations" : <a href={`${host}/mon-espace/mes-declarations`}>Accéder à mon espace</a>
          </p>
          <p>
            Pour tout renseignement utile, vous pouvez contacter votre référent égalité professionnelle femmes‑hommes au
            sein de votre DREETS en répondant à ce message.
          </p>
          <p>Veuillez agréer, Madame, Monsieur, nos salutations distinguées,</p>
          <p>Les services de l’administration du travail</p>
        </body>
      </html>,
    ),
});
