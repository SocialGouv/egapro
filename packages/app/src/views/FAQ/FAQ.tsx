/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { Route, Switch, RouteComponentProps } from "react-router-dom";

import { useLayoutType } from "../../components/GridContext";

import FAQHeader from "./components/FAQHeader";
import FAQFooter from "./components/FAQFooter";

import FAQHome from "./FAQHome";
import FAQSection from "./FAQSection";
import FAQQuestion from "./FAQQuestion";
import FAQContact from "./FAQContact";
import globalStyles from "../../utils/globalStyles";

const FAQPaths: { [key: string]: string } = {
  effectifs: "/section/effectifs",
  indicateur1: "/section/indicateur1",
  indicateur2: "/section/indicateur2",
  indicateur3: "/section/indicateur3",
  indicateur4: "/section/indicateur4",
  indicateur5: "/section/indicateur5",
  recapitulatif: "/section/resultat"
};

function mapDefaultPathnameToFAQPathname(
  location: RouteComponentProps["location"]
) {
  if (location.state && location.state.faq) {
    return location.state.faq;
  }
  const splittedLocationPathname = location.pathname.split("/").filter(Boolean);
  if (
    splittedLocationPathname[0] !== "simulateur" ||
    splittedLocationPathname.length !== 3
  ) {
    return location.pathname;
  }
  const faqPath = FAQPaths[splittedLocationPathname[2]];
  return faqPath ? faqPath : location.pathname;
}

interface Props {
  closeMenu?: () => void;
}

function FAQ({ closeMenu }: Props) {
  const layoutType = useLayoutType();
  return (
    <Route
      render={({ location }) => {
        const locationFAQ = {
          pathname: mapDefaultPathnameToFAQPathname(location),
          search: "",
          hash: "",
          state: undefined
        };
        return (
          <div css={styles.container}>
            <FAQHeader location={locationFAQ} closeMenu={closeMenu} />

            <div
              css={[
                styles.content,
                layoutType === "tablet" && styles.contentTablet,
                layoutType === "mobile" && styles.contentMobile
              ]}
              key={locationFAQ.pathname}
            >
              <Switch location={locationFAQ}>
                <Route
                  path={["/", "/simulateur/:code"]}
                  exact
                  render={() => <FAQHome />}
                />

                <Route
                  exact
                  path="/section/:section"
                  render={({
                    match: {
                      params: { section }
                    }
                  }) => <FAQSection section={section} />}
                />

                <Route
                  exact
                  path="/part/:part/question/:indexQuestion"
                  render={({
                    history,
                    match: {
                      params: { part, indexQuestion }
                    }
                  }) => (
                    <FAQQuestion
                      history={history}
                      part={part}
                      indexQuestion={indexQuestion}
                    />
                  )}
                />

                <Route exact path="/contact" render={() => <FAQContact />} />
              </Switch>

              <FAQFooter />
            </div>
          </div>
        );
      }}
    />
  );
}

const styles = {
  container: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white"
  }),
  content: css({
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "column",
    paddingRight: 29,
    paddingLeft: 29,
    paddingTop: 26,
    "@media all and (-ms-high-contrast: none), (-ms-high-contrast: active)": {
      // Only target IE11
      display: "block"
    }
  }),
  contentTablet: css({
    paddingRight: 21,
    paddingLeft: 21
  }),
  contentMobile: css({
    paddingRight: globalStyles.grid.gutterWidth,
    paddingLeft: globalStyles.grid.gutterWidth
  })
};

export default FAQ;
