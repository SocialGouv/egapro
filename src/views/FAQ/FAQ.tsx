/** @jsx jsx */
import { css, jsx } from "@emotion/core"

import { StaticContext } from "react-router"
import { Route, Switch, RouteComponentProps } from "react-router-dom"

import { useLayoutType } from "../../components/GridContext"

import FAQHeader from "./components/FAQHeader"
import FAQFooter from "./components/FAQFooter"

import FAQHome from "./FAQHome"
import FAQSection from "./FAQSection"
import FAQSectionDetailCalcul from "./FAQSectionDetailCalcul"
import FAQQuestion from "./FAQQuestion"
import globalStyles from "../../utils/globalStyles"

const FAQPaths: { [key: string]: string } = {
  informations: "/section/informations",
  effectifs: "/section/effectifs",
  indicateur1: "/section/indicateur1",
  indicateur2: "/section/indicateur2",
  indicateur3: "/section/indicateur3",
  indicateur2et3: "/section/indicateur2et3",
  indicateur4: "/section/indicateur4",
  indicateur5: "/section/indicateur5",
  recapitulatif: "/section/resultat",
}

type LocationState = {
  faq?: string
}

type FAQRouteComponentProps = RouteComponentProps<Record<string, string>, StaticContext, LocationState>

function mapDefaultPathnameToFAQPathname(location: FAQRouteComponentProps["location"]) {
  if (location.state && location.state.faq) {
    return location.state.faq
  }
  const splittedLocationPathname = location.pathname.split("/").filter(Boolean)
  if (splittedLocationPathname[0] !== "simulateur" || splittedLocationPathname.length !== 3) {
    return location.pathname
  }
  const faqPath = FAQPaths[splittedLocationPathname[2]]
  return faqPath ? faqPath : location.pathname
}

interface Props {
  closeMenu?: () => void
}

function FAQ({ closeMenu }: Props) {
  const layoutType = useLayoutType()
  return (
    <Route
      render={(route) => {
        const location = (route as FAQRouteComponentProps).location
        const locationFAQ = {
          pathname: mapDefaultPathnameToFAQPathname(location),
          search: "",
          hash: "",
          state: undefined,
        }
        return (
          <aside id="search" role="search" css={styles.container}>
            <FAQHeader location={locationFAQ} closeMenu={closeMenu} />
            <div
              css={[
                styles.content,
                layoutType === "tablet" && styles.contentTablet,
                layoutType === "mobile" && styles.contentMobile,
              ]}
              key={locationFAQ.pathname}
            >
              <Switch location={locationFAQ}>
                <Route
                  path={[
                    "/",
                    "/simulateur/:code",
                    "/mentions-legales",
                    "/accessibilite",
                    "/cgu",
                    "/politique-confidentialite",
                  ]}
                  exact
                  render={() => <FAQHome />}
                />

                {/* TODO: move to FAQPaths when a dedicated content is added */}
                <Route path={["/", "/simulateur/:code/informations-entreprise"]} exact render={() => <FAQHome />} />

                {/* TODO: move to FAQPaths when a dedicated content is added */}
                <Route path={["/", "/simulateur/:code/informations-declarant"]} exact render={() => <FAQHome />} />

                {/* TODO: move to FAQPaths when a dedicated content is added */}
                <Route path={["/", "/simulateur/:code/declaration"]} exact render={() => <FAQHome />} />

                <Route
                  exact
                  path="/section/:section"
                  render={({
                    match: {
                      params: { section },
                    },
                  }) => <FAQSection section={section} />}
                />

                <Route
                  exact
                  path="/section/:section/detail-calcul"
                  render={({
                    history,
                    match: {
                      params: { section },
                    },
                  }) => <FAQSectionDetailCalcul history={history} section={section} />}
                />

                <Route
                  exact
                  path="/part/:part/question/:indexQuestion"
                  render={({
                    history,
                    match: {
                      params: { part, indexQuestion },
                    },
                  }) => <FAQQuestion history={history} part={part} indexQuestion={indexQuestion} />}
                />
              </Switch>

              <FAQFooter />
            </div>
          </aside>
        )
      }}
    />
  )
}

const styles = {
  container: css({
    position: "sticky",
    top: "0",
    backgroundColor: "white",
  }),
  content: css({
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    maxHeight: "calc(100vh - 80px)",
    paddingRight: 29,
    paddingLeft: 29,
    paddingTop: 26,
    position: "relative",
    "@media all and (-ms-high-contrast: none), (-ms-high-contrast: active)": {
      // Only target IE11
      display: "block",
    },
  }),
  contentTablet: css({
    paddingRight: 21,
    paddingLeft: 21,
  }),
  contentMobile: css({
    paddingRight: globalStyles.grid.gutterWidth,
    paddingLeft: globalStyles.grid.gutterWidth,
  }),
}

export default FAQ
