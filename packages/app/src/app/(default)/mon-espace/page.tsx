"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { config } from "@common/config";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const proconnectManageOrganisationsUrl =
  config.proconnect.manageOrganisationUrl;

type ViewMode = "list" | "table";

// Mock companies data - in real app, this would come from API
const mockCompanies = [
  {
    name: "Alpha Solutions",
    siren: "532 847 196",
    statusRemuneration: "EN COURS" as const,
    statusRepresentation: "EN COURS" as const,
  },
  {
    name: "Nova Consulting",
    siren: "718 354 202",
    statusRemuneration: "EN COURS" as const,
    statusRepresentation: "EN COURS" as const,
  },
  {
    name: "Delta Bâtiment",
    siren: "824 563 109",
    statusRemuneration: "EN COURS" as const,
    statusRepresentation: "EN COURS" as const,
  },
  {
    name: "Orion Technologies",
    siren: "868 245 317",
    statusRemuneration: "EN COURS" as const,
    statusRepresentation: "EFFECTUÉ" as const,
  },
  {
    name: "Prime Gestion",
    siren: "856 191 943",
    statusRemuneration: "EFFECTUÉ" as const,
    statusRepresentation: "EFFECTUÉ" as const,
  },
  {
    name: "Hexa Services",
    siren: "942 806 165",
    statusRemuneration: "EFFECTUÉ" as const,
    statusRepresentation: "EFFECTUÉ" as const,
  },
];

const getStatusSeverity = (status: "EN COURS" | "EFFECTUÉ") =>
  status === "EFFECTUÉ" ? ("success" as const) : ("warning" as const);

const CompaniesHelp = () => {
  return (
    <div
      className={fr.cx("fr-mt-6w")}
      style={{ backgroundColor: "var(--background-alt-blue-france, #e3e3fd)" }}
    >
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-py-4w")}>
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
                    <span
                      className={fr.cx("fr-icon-question-line", "fr-icon--lg")}
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
                    <span
                      className={fr.cx("fr-icon-article-line", "fr-icon--lg")}
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
                    <span
                      className={fr.cx(
                        "fr-icon-customer-service-line",
                        "fr-icon--lg",
                      )}
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
          {/* Illustration */}
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

const MySpacePage = () => {
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (status === "authenticated" && !session?.user.entreprise) {
      signIn("proconnect", { callbackUrl: "/mon-espace" });
    }
  }, [status, session]);

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

      {/* Bandeau gris : breadcrumb + déclarant */}
      <div className={fr.cx("fr-background-alt--grey")}>
        <div className={fr.cx("fr-container", "fr-pt-1w", "fr-pb-3w")}>
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
                  <a className={fr.cx("fr-breadcrumb__link")} aria-current>
                    Mon espace
                  </a>
                </li>
              </ol>
            </div>
          </nav>

          <div className={fr.cx("fr-mt-2w")}>
            <div className={fr.cx("fr-text--sm")}>
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
      </div>

      <div className={fr.cx("fr-container", "fr-my-6w")}>
        {/* Header with title and add button */}
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        >
          <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
            <h1 className={fr.cx("fr-mb-0")}>Liste de vos entreprises</h1>
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <Button
              iconId="fr-icon-add-line"
              priority="secondary"
              linkProps={{
                href: "#",
                target: "_blank",
              }}
            >
              Ajouter une entreprise sur ProConnect
            </Button>
          </div>
        </div>

        {/* Count and view toggle */}
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        >
          <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
            <span className={fr.cx("fr-text--bold")}>
              {mockCompanies.length} entreprises
            </span>
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <ButtonsGroup
              alignment="right"
              inlineLayoutWhen="always"
              buttons={[
                {
                  children: "Liste",
                  iconId: "fr-icon-list-unordered",
                  priority: viewMode === "list" ? "secondary" : "tertiary",
                  onClick: () => setViewMode("list"),
                },
                {
                  children: "Tableau",
                  iconId: "fr-icon-table-line",
                  priority: viewMode === "table" ? "secondary" : "tertiary",
                  onClick: () => setViewMode("table"),
                },
              ]}
            />
          </div>
        </div>

        {viewMode === "list" ? (
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {mockCompanies.map((company) => (
              <div
                key={company.siren}
                className={fr.cx("fr-col-12", "fr-col-md-4")}
              >
                <div className={fr.cx("fr-tile", "fr-enlarge-link")}>
                  <div className={fr.cx("fr-tile__body")}>
                    <div className={fr.cx("fr-tile__content")}>
                      <div className={fr.cx("fr-tile__start")}>
                        <Badge
                          noIcon
                          severity={getStatusSeverity(
                            company.statusRemuneration,
                          )}
                        >
                          {company.statusRemuneration}
                        </Badge>
                      </div>
                      <h3 className={fr.cx("fr-tile__title")}>
                        <Link
                          href={`/mon-espace/raison-social?siren=${company.siren.replace(/\s/g, "")}`}
                        >
                          {company.name}
                        </Link>
                      </h3>
                      <p className={fr.cx("fr-tile__desc")}>
                        <span
                          className={fr.cx("fr-icon-building-line", "fr-mr-1w")}
                          aria-hidden="true"
                        />
                        N° SIREN : {company.siren}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={fr.cx("fr-table", "fr-table--layout-fixed")}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Raison sociale</th>
                  <th scope="col">SIREN</th>
                  <th scope="col">Déclaration rémunération</th>
                  <th scope="col">Déclaration représentation</th>
                </tr>
              </thead>
              <tbody>
                {mockCompanies.slice(0, rowsPerPage).map((company) => (
                  <tr key={company.siren}>
                    <th scope="row">
                      <Link
                        href={`/mon-espace/raison-social?siren=${company.siren.replace(/\s/g, "")}`}
                      >
                        {company.name}
                      </Link>
                    </th>
                    <td>{company.siren}</td>
                    <td>
                      <Badge
                        noIcon
                        severity={getStatusSeverity(company.statusRemuneration)}
                      >
                        {company.statusRemuneration}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        noIcon
                        severity={getStatusSeverity(
                          company.statusRepresentation,
                        )}
                      >
                        {company.statusRepresentation}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CompaniesHelp />
      </div>
    </>
  );
};

export default MySpacePage;
