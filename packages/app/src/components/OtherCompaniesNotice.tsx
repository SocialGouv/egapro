import { fr } from "@codegouvfr/react-dsfr";
import { config } from "@common/config";
import { getExternalLinkTitle } from "@common/utils/accessibility";

const proconnectProfileLinkText = "votre profil ProConnect";

export const OtherCompaniesNotice = () => (
  <>
    <p className={fr.cx("fr-mb-1w")}>
      <strong>Vous devez déclarer pour d'autres entreprises&nbsp;?</strong>
    </p>
    <ul className={fr.cx("fr-mb-0")}>
      <li>
        Si elles sont déjà rattachées à votre compte ProConnect&nbsp;: déconnectez-vous puis reconnectez-vous afin de
        sélectionner l'entreprise de votre choix.
      </li>
      <li>
        Si elles ne sont pas encore rattachées&nbsp;: rendez-vous dans la section «&nbsp;Organisations&nbsp;» de{" "}
        <a
          href={config.proconnect.manageOrganisationUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={getExternalLinkTitle(proconnectProfileLinkText)}
        >
          {proconnectProfileLinkText}
        </a>{" "}
        pour les ajouter.
      </li>
    </ul>
  </>
);
