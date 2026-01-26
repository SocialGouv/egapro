"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Archive from "@codegouvfr/react-dsfr/picto/Archive";
import Question from "@codegouvfr/react-dsfr/picto/Question";
import Article from "@codegouvfr/react-dsfr/picto/Article";
import CustomerService from "@codegouvfr/react-dsfr/picto/CustomerService";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";

// Mock company data
const companyData = {
  name: "Alpha Solutions",
  siren: "532 847 196",
  address: "12 rue des Industriels, 75011 Paris",
  codeNaf: "6202A Conseil en systèmes et logiciels informatiques",
  effectif: "Entre 50 et 249 salariés",
};

// Mock current declarations
const currentDeclarations = [
  {
    year: "Indicateurs de l'année 2027",
    type: "Indicateurs de représentation des calcul",
    status: "À COMPLETER",
    statusColor: "warning" as const,
    action: "Commencer la déclaration",
  },
  {
    year: "Indicateurs de l'année 2027",
    type: "Accès vigilants de représentation 2027",
    status: "CONFIRMÉ",
    statusColor: "info" as const,
    action: "Voir",
  },
];

// Mock previous years declarations
const previousDeclarations = [
  {
    year: "Indicateurs de l'année 2026",
    type: "Indicateurs de représentation des calcul",
    status: "VALIDÉE",
    statusColor: "success" as const,
  },
  {
    year: "Indicateurs de l'année 2026",
    type: "Confirmation de dépôt",
    status: "VALIDÉE",
    statusColor: "success" as const,
  },
];

const CompaniesHelp = () => {
  return (
    <div className={fr.cx("fr-mt-6w")}>
      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-py-4w")}
        style={{
          borderBottom: "2px solid var(--border-active-blue-france)",
        }}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <div className={fr.cx("fr-card", "fr-enlarge-link")}>
                <div className={fr.cx("fr-card__body")}>
                  <div className={fr.cx("fr-card__content")}>
                    <h3 className={fr.cx("fr-card__title")}>
                      <a className={fr.cx("fr-card__link")} href="#">
                        Questions fréquentes (FAQ)
                      </a>
                    </h3>
                    <p className={fr.cx("fr-card__desc")}>
                      Réponses aux questions les plus courantes
                    </p>
                  </div>
                </div>
                <div className={fr.cx("fr-card__header")}>
                  <div className={fr.cx("fr-card__img")}>
                    <Question
                      className={fr.cx("fr-picto", "fr-picto--lg")}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <div className={fr.cx("fr-card", "fr-enlarge-link")}>
                <div className={fr.cx("fr-card__body")}>
                  <div className={fr.cx("fr-card__content")}>
                    <h3 className={fr.cx("fr-card__title")}>
                      <a className={fr.cx("fr-card__link")} href="#">
                        Textes de référence
                      </a>
                    </h3>
                    <p className={fr.cx("fr-card__desc")}>
                      Consultez les textes législatifs et réglementaires
                    </p>
                  </div>
                </div>
                <div className={fr.cx("fr-card__header")}>
                  <div className={fr.cx("fr-card__img")}>
                    <Article
                      className={fr.cx("fr-picto", "fr-picto--lg")}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <div className={fr.cx("fr-card", "fr-enlarge-link")}>
                <div className={fr.cx("fr-card__body")}>
                  <div className={fr.cx("fr-card__content")}>
                    <h3 className={fr.cx("fr-card__title")}>
                      <a className={fr.cx("fr-card__link")} href="#">
                        Nous contacter
                      </a>
                    </h3>
                    <p className={fr.cx("fr-card__desc")}>
                      Besoin d’aide ? Contactez nos équipes d’assistance
                    </p>
                  </div>
                </div>
                <div className={fr.cx("fr-card__header")}>
                  <div className={fr.cx("fr-card__img")}>
                    <CustomerService
                      className={fr.cx("fr-picto", "fr-picto--lg")}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={fr.cx(
            "fr-col-12",
            "fr-col-md-3",
            "fr-grid-row--center",
            "fr-grid-row--middle",
          )}
        >
          <img
            src="/img/question.svg"
            alt=""
            style={{ maxWidth: "180px", width: "100%", height: "auto" }}
          />
        </div>
      </div>
    </div>
  );
};

const RaisonSocialPage = () => {
  const searchParams = useSearchParams();
  const siren = searchParams?.get("siren");
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const allRows = useMemo(
    () => ({ current: currentDeclarations, previous: previousDeclarations }),
    [],
  );

  return (
    <>
      {/* Notice (bandeau bleu) sous le header */}
      {isNoticeVisible && (
        <div className={fr.cx("fr-notice", "fr-notice--info")}>
          <div className={fr.cx("fr-container")}>
            <div className={fr.cx("fr-notice__body")}>
              <p className={fr.cx("fr-notice__title")}>
                Bienvenue sur votre espace Egapro. Vos informations
                professionnelles et personnelles ont été renseignées
                automatiquement via ProConnect.
              </p>
              <button
                className={fr.cx("fr-btn--close", "fr-btn")}
                title="Masquer le message"
                type="button"
                onClick={() => setIsNoticeVisible(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bandeau gris : breadcrumb + entreprise + déclarant */}
      <div className={fr.cx("fr-background-alt--grey")}>
        <div className={fr.cx("fr-container", "fr-pt-2w", "fr-pb-3w")}>
          <nav
            role="navigation"
            className={fr.cx("fr-breadcrumb")}
            aria-label="vous êtes ici :"
          >
            <button
              className={fr.cx("fr-breadcrumb__button")}
              aria-expanded="false"
              aria-controls="breadcrumb-1"
            >
              Voir le fil d'Ariane
            </button>
            <div className={fr.cx("fr-collapse")} id="breadcrumb-1">
              <ol className={fr.cx("fr-breadcrumb__list")}>
                <li>
                  <Link className={fr.cx("fr-breadcrumb__link")} href="/">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link
                    className={fr.cx("fr-breadcrumb__link")}
                    href="/mon-espace"
                  >
                    Mon espace
                  </Link>
                </li>
                <li>
                  <a
                    className={fr.cx("fr-breadcrumb__link")}
                    aria-current="page"
                  >
                    Raison sociale
                  </a>
                </li>
              </ol>
            </div>
          </nav>

          <h1 className={fr.cx("fr-mb-2w")}>{companyData.name}</h1>
          <div className={fr.cx("fr-text--sm", "fr-mb-2w")}>
            <span
              className={fr.cx("fr-icon-building-line", "fr-mr-1w")}
              aria-hidden="true"
            />
            N° SIREN : {companyData.siren}
            <span className={fr.cx("fr-mx-2w")}>|</span>
            <span
              className={fr.cx("fr-icon-map-pin-2-line", "fr-mr-1w")}
              aria-hidden="true"
            />
            {companyData.address}
          </div>
          <div className={fr.cx("fr-text--sm", "fr-mb-2w")}>
            <span
              className={fr.cx("fr-icon-briefcase-line", "fr-mr-1w")}
              aria-hidden="true"
            />
            Code NAF : {companyData.codeNaf}
            <span className={fr.cx("fr-mx-2w")}>|</span>
            <span
              className={fr.cx("fr-icon-team-line", "fr-mr-1w")}
              aria-hidden="true"
            />
            Effectif déclaré : {companyData.effectif}
          </div>
          <Button
            iconId="fr-icon-edit-line"
            priority="tertiary no outline"
            size="small"
            title="Modifier"
          >
            Modifier
          </Button>

          <div className={fr.cx("fr-text--sm", "fr-mt-2w")}>
            <span
              className={fr.cx("fr-icon-user-fill", "fr-mr-1w")}
              aria-hidden="true"
            />
            Déclarant : <strong>Martin Julien</strong>
            <span className={fr.cx("fr-mx-2w")}>|</span>
            <span
              className={fr.cx("fr-icon-mail-fill", "fr-mr-1w")}
              aria-hidden="true"
            />
            Email : <strong>julien.martin@alpha-solution.fr</strong>
            <span className={fr.cx("fr-mx-2w")}>|</span>
            <span
              className={fr.cx("fr-icon-phone-fill", "fr-mr-1w")}
              aria-hidden="true"
            />
            Téléphone :{" "}
            <strong style={{ color: "var(--text-default-warning)" }}>
              À COMPLÉTER
            </strong>
            <Button
              iconId="fr-icon-edit-line"
              priority="tertiary no outline"
              size="small"
              className={fr.cx("fr-ml-2w")}
              title="Modifier"
            />
          </div>
        </div>
      </div>

      <div className={fr.cx("fr-container", "fr-my-6w")}>
        <h2 className={fr.cx("fr-mb-3w")}>Déclarations</h2>

        {/* Tableau unique avec intertitre */}
        <div className={fr.cx("fr-table", "fr-table--layout-fixed")}>
          <table>
            <thead>
              <tr>
                <th scope="col">Déclaration</th>
                <th scope="col">État</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {allRows.current.slice(0, rowsPerPage).map((declaration, idx) => (
                <tr key={`current-${idx}`}>
                  <th scope="row">
                    <div>
                      <strong>{declaration.year}</strong>
                    </div>
                    <div className={fr.cx("fr-text--sm")}>
                      {declaration.type}
                    </div>
                  </th>
                  <td>
                    <Badge noIcon severity={declaration.statusColor}>
                      {declaration.status}
                    </Badge>
                  </td>
                  <td>
                    <Button priority="secondary" size="small">
                      {declaration.action}
                    </Button>
                  </td>
                </tr>
              ))}

              <tr>
                <th
                  scope="rowgroup"
                  colSpan={3}
                  className={fr.cx("fr-text--bold")}
                  style={{ backgroundColor: "var(--background-alt-grey)" }}
                >
                  Années précédentes
                </th>
              </tr>

              {allRows.previous
                .slice(0, rowsPerPage)
                .map((declaration, idx) => (
                  <tr key={`previous-${idx}`}>
                    <th scope="row">
                      <div>
                        <strong>{declaration.year}</strong>
                      </div>
                      <div className={fr.cx("fr-text--sm")}>
                        {declaration.type}
                      </div>
                    </th>
                    <td>
                      <Badge noIcon severity={declaration.statusColor}>
                        {declaration.status}
                      </Badge>
                    </td>
                    <td>
                      <div
                        className={fr.cx(
                          "fr-btns-group",
                          "fr-btns-group--inline",
                        )}
                      >
                        <Button
                          priority="tertiary"
                          size="small"
                          iconId="fr-icon-download-line"
                        >
                          Télécharger
                        </Button>
                        <Button priority="tertiary" size="small">
                          Voir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Select : lignes par page */}
        <div className={fr.cx("fr-mt-2w")}>
          <div className={fr.cx("fr-select-group", "fr-col-12", "fr-col-md-3")}>
            <label className={fr.cx("fr-label")} htmlFor="rows-per-page">
              Lignes par page
            </label>
            <select
              id="rows-per-page"
              className={fr.cx("fr-select")}
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} lignes par page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Archives section */}
        <div
          className={fr.cx("fr-mt-6w", "fr-p-4w")}
          style={{ backgroundColor: "var(--background-alt-grey)" }}
        >
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
              <h3 className={fr.cx("fr-mb-2w")}>
                <span
                  className={fr.cx("fr-icon-archive-line", "fr-mr-2w")}
                  aria-hidden="true"
                />
                Archives
              </h3>
              <p className={fr.cx("fr-mb-0")}>
                Vous pouvez consulter les archives des déclarations et des
                objectifs de la déclaration pour les années antérieures à 2026
                en cliquant sur le bouton ci-dessous.
              </p>
            </div>
            <div
              className={fr.cx(
                "fr-col-12",
                "fr-col-md-3",
                "fr-grid-row--center",
                "fr-grid-row--middle",
              )}
            >
              <Button
                priority="secondary"
                iconId="fr-icon-arrow-right-line"
                iconPosition="right"
              >
                Consulter les archives
              </Button>
            </div>
          </div>
        </div>

        <CompaniesHelp />
      </div>
    </>
  );
};

export default RaisonSocialPage;
