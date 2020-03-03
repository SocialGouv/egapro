/** @jsx jsx */
import * as React from "react";
import {useCallback, useState} from "react";
import {css, jsx} from "@emotion/core";
import {useInputValueChangeHandler} from "../../utils/hooks";
import {findIndicatorsDataForRaisonSociale} from "../../utils/api";
import {AppState} from "../../globals";
import Field from "../../components/MinistereTravail/Field";
import SearchButton from "../../components/MinistereTravail/SearchButton";
import ConsulterIndexResult from "./ConsulterIndexResult";
import SearchResultHeaderText from "./SearchResultHeaderText";
import LogoIndex from "./LogoIndex";
import {TEXT, TITLE} from "../../components/MinistereTravail/colors";
import DownloadButton from "./DownloadButton";
import SocialNetworksLinks from "./SocialNetworksLinks";


export interface FetchedIndicatorsData {
  id: string,
  data: {
    informations: AppState["informations"];
    declaration: AppState["declaration"];
    informationsEntreprise: AppState["informationsEntreprise"];
  }
}

const ConsulterIndex: React.FC = () => {
  const [raisonSociale, setRaisonSociale] = useState("");
  const [lastResearch, setLastResearch] = useState("");
  const [indicatorsData, setIndicatorsData] = useState([]);

  const handleRaisonSocialChange = useInputValueChangeHandler(setRaisonSociale);

  const search = useCallback((event) => {
    event.preventDefault();
    if (raisonSociale.length > 0) {
      setLastResearch(raisonSociale);
      findIndicatorsDataForRaisonSociale(raisonSociale)
        .then(({ jsonBody }) => {
          setIndicatorsData(jsonBody);
        });
    }
  }, [raisonSociale, setIndicatorsData, setLastResearch]);

  return (<div css={styles.body}>
    <div css={styles.logoWrapper}>
      <LogoIndex />
    </div>
    <h2 css={styles.title}>
      Retrouvez l'Index égalité professionnelle F/H publié par les entreprises de plus de 1000 salariés.
    </h2>
    <p css={styles.subtitle}>
      Dans une volonté de transparence et d'avancée sociale pour toutes et tous, le Ministère
      du Travail a décidé de faciliter l'accès aux informations des entreprises qui publient leur
      index depuis plus d'1 an.
    </p>
    <form css={styles.searchFieldWrapper} onSubmit={search}>
      <Field value={raisonSociale} placeholder="Raison Sociale" onChange={handleRaisonSocialChange}/>
      <SearchButton onClick={search}/>
    </form>

    {
      lastResearch &&
        <SearchResultHeaderText searchResults={indicatorsData} searchTerms={lastResearch} />
    }
    {
      indicatorsData.length > 0 &&
        <ConsulterIndexResult indicatorsData={indicatorsData}/>
    }
    <div css={styles.downloadSection}>
      <div css={styles.downloadAlign}>
        <div css={styles.downloadText}>Télécharger l'intégralité des données</div>
        <div>
          <DownloadButton/>
        </div>
      </div>
    </div>
    <div>
      <p css={styles.subtitle}>
        Porté par la loi « Pour la liberté de choisir son avenir personnel » du 5 septembre
        2018, l'Index d'égalité professionnelle a été conçu pour faire progresser au sein
        des entreprises l'égalité salariale entre les hommes et les femmes.
      </p>
    </div>
    <div css={styles.socialNetworks}>
      <SocialNetworksLinks />
    </div>
  </div>);
};

const styles = {
  logoWrapper: css({
    marginBottom: "50px"
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
    padding: "30px"
  }),
  title: css({
    fontFamily: "Noto Sans",
    fontWeight: "normal",
    color: TITLE
  }),
  subtitle: css({
    fontFamily: "Open Sans",
    fontSize: "1em",
    color: TEXT
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
    marginBottom: "10px",
  }),
  socialNetworks: css({
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "40px"
  })
};

export default ConsulterIndex;
