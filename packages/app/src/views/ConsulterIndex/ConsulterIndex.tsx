/** @jsx jsx */
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { css, jsx } from "@emotion/core";
import { useDebounceEffect } from "../../utils/hooks";
import { findIndicatorsDataForRaisonSociale } from "../../utils/api";
import { AppState } from "../../globals";
import ConsulterIndexResult, { SortOption } from "./ConsulterIndexResult";
import SearchResultHeaderText from "./SearchResultHeaderText";
import LogoIndex from "./LogoIndex";
import { TITLE } from "../../components/MinistereTravail/colors";
import DownloadButton from "./DownloadButton";
import SocialNetworksLinks from "./SocialNetworksLinks";
import Subtitle from "../../components/MinistereTravail/Subtitle";
import CsvUpdateDate from "./CsvUpdateDate";
import SearchBox from "../../components/MinistereTravail/SearchBox";

export interface FetchedIndicatorsData {
  id: string;
  data: {
    informations: AppState["informations"];
    declaration: AppState["declaration"];
    informationsEntreprise: AppState["informationsEntreprise"];
  };
}

const PAGE_SIZE = 10;

const ConsulterIndex: React.FC = () => {
  const [lastResearch, setLastResearch] = useState("");
  const [indicatorsData, setIndicatorsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [dataSize, setDataSize] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption | undefined>();

  const search = useCallback(
    raisonSociale => {
      setLastResearch(raisonSociale);
      setCurrentPage(0);
    },
    [setLastResearch]
  );

  const searchParams = useMemo(
    () => ({
      sortBy,
      currentPage,
      lastResearch
    }),
    [sortBy, currentPage, lastResearch]
  );

  useDebounceEffect(
    searchParams,
    300,
    ({
      sortBy: debouncedSortBy,
      currentPage: debouncedCurrentPage,
      lastResearch: debouncedLastResearch
    }) => {
      if (debouncedLastResearch.length > 0) {
        findIndicatorsDataForRaisonSociale(debouncedLastResearch, {
          size: PAGE_SIZE,
          from: PAGE_SIZE * debouncedCurrentPage,
          order: (debouncedSortBy && debouncedSortBy.order) || "",
          sortBy: (debouncedSortBy && debouncedSortBy.field) || ""
        }).then(({ jsonBody: { total, data } }) => {
          setIndicatorsData(data);
          setDataSize(total);
        });
      }
    },
    [setIndicatorsData, setLastResearch, setDataSize]
  );

  return (
    <div css={styles.body}>
      <div css={styles.logoWrapper}>
        <a href="/consulter-index">
          <LogoIndex />
        </a>
      </div>
      <h2 css={styles.title}>
        Retrouvez l'Index égalité professionnelle F/H publié par les entreprises
        de plus de 1000 salariés.
      </h2>
      <Subtitle>
        Dans une volonté de transparence et d'avancée sociale pour toutes et
        tous, le Ministère du Travail a décidé de faciliter l'accès aux
        informations des entreprises qui publient leur index depuis plus d'un
        an.
      </Subtitle>
      <div css={styles.searchFieldWrapper}>
        <SearchBox onSearch={search} placeholder="Raison Sociale" />
      </div>

      {lastResearch && (
        <SearchResultHeaderText
          searchResults={indicatorsData}
          searchTerms={lastResearch}
        />
      )}
      {indicatorsData.length > 0 && (
        <ConsulterIndexResult
          currentPage={currentPage}
          indicatorsData={indicatorsData}
          dataSize={dataSize}
          onPageChange={setCurrentPage}
          onSortByChange={setSortBy}
        />
      )}
      <div css={styles.downloadSection}>
        <div css={styles.downloadAlign}>
          <div css={styles.downloadText}>
            Télécharger l'intégralité des données au <CsvUpdateDate />
          </div>
          <div>
            <DownloadButton />
          </div>
        </div>
      </div>
      <div>
        <Subtitle>
          Porté par la loi « Pour la liberté de choisir son avenir personnel »
          du 5 septembre 2018, l'Index d'égalité professionnelle a été conçu
          pour faire progresser au sein des entreprises l'égalité salariale
          entre les hommes et les femmes.
        </Subtitle>
      </div>
      <div css={styles.socialNetworks}>
        <div>
          <Subtitle>
            Si vous constatez une information erronée, merci d’adresser un email
            à :{" "}
            <a href="mailto: index@travail.gouv.fr">index@travail.gouv.fr</a>
          </Subtitle>
        </div>
        <div>
          <Subtitle>
            <a
              href="https://voxusagers.numerique.gouv.fr/Demarches/2442?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
            >
              Donnez-nous votre avis
            </a>
          </Subtitle>
        </div>
        <SocialNetworksLinks />
      </div>
    </div>
  );
};

const styles = {
  logoWrapper: css({
    marginBottom: "30px"
  }),
  searchFieldWrapper: css({
    display: "flex",
    width: "100%",
    justifyContent: "center",
    marginTop: "30px",
    marginBottom: "30px",
    fontSize: "18px"
  }),
  body: css({
    backgroundColor: "white",
    padding: "30px",
    overflow: "auto"
  }),
  title: css({
    fontFamily: "Noto Sans",
    fontWeight: "normal",
    color: TITLE
  }),
  downloadSection: css({
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    marginBottom: "20px"
  }),
  downloadAlign: css({
    display: "flex",
    alignItems: "center",
    flexDirection: "column"
  }),
  downloadText: css({
    marginBottom: "10px"
  }),
  socialNetworks: css({
    display: "flex",
    justifyContent: "space-between",
    marginTop: "40px"
  })
};

export default ConsulterIndex;
