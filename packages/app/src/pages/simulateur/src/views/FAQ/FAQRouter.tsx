import React, { FunctionComponent, useMemo } from "react"
//import { StaticContext } from "react-router"
//import { Route, Switch, RouteComponentProps } from "react-router-dom"
import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import type { FAQSectionType, FAQPartType } from "../../globals"

import FAQHeader from "./components/FAQHeader"
import FAQFooter from "./components/FAQFooter"

import FAQHome from "./FAQHome"
import FAQSection from "./FAQSection"
import FAQSectionDetailCalcul from "./FAQSectionDetailCalcul"
import FAQQuestion from "./FAQQuestion"

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

/*
type LocationState = {
  faq?: string
}
*/

// type FAQRouteComponentProps = RouteComponentProps<Record<string, string>, StaticContext, LocationState>

/*
const mapDefaultPathnameToFAQPathname = (location: FAQRouteComponentProps["location"]) => {
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
*/

const StaticPageComponentNames: string[] = [
  "Home",
  "MentionsLegales",
  "Accessibilite",
  "CGU",
  "PolitiqueConfidentialite",
]

function extractPagePath(pathname: string): string {
  const splittedPath = pathname.split("/")
  const pathIndex = splittedPath.length - 1
  return splittedPath[pathIndex]
}

interface FAQRouterProps {
  closeMenu?: () => void
}

const FAQRouter: FunctionComponent<FAQRouterProps> = ({ closeMenu }) => {
  const router = useRouter()
  const {
    query: { section, part, indexQuestion },
  } = router
  const pathname = useMemo(() => router?.pathname, [router])
  const pagePath = useMemo(() => (pathname ? extractPagePath(pathname) : ""), [pathname])
  const isCurrentPageStatic = useMemo(() => StaticPageComponentNames.includes(pagePath), [pagePath])

  return (
    <Box as="aside" id="search" role="search" bg="white">
      <FAQHeader closeMenu={closeMenu} />
      <Box p={6} overflowY="auto" maxHeight="100vh" sx={{ WebkitOverflowScrolling: "touch" }} key={pathname}>
        {isCurrentPageStatic && !section && !part && <FAQHome />}
        {!!section && !part && <FAQSection section={section as FAQSectionType} />}

        {part && !!indexQuestion && (
          <FAQQuestion part={part as FAQPartType} indexQuestion={Number(indexQuestion)} section={section} />
        )}
        {/*
      <Switch location={locationFAQ}>
        <Route
          path={[
            "/",
            "/simulateur/:code",
            "/mentions-legales",
            "/accessibilite",
            "/cgu",
            "/politique-confidentialite",
            "/tableauDeBord/me-connecter",
            "/tableauDeBord/mes-entreprises",
            "/tableauDeBord/mon-profil",
          ]}
          exact
          render={() => <FAQHome />}
        />

        <Route path={["/", "/simulateur/:code/informations-entreprise"]} exact render={() => <FAQHome />} />

        <Route path={["/", "/simulateur/:code/informations-declarant"]} exact render={() => <FAQHome />} />

        <Route path={["/", "/simulateur/:code/declaration"]} exact render={() => <FAQHome />} />

        <Route
          exact
          path="/section/:section"
          render={({
            match: {
              params: { section },
            },
          }) => <FAQSection section={section as FAQSectionType} />}
        />

        <Route
          exact
          path="/section/:section/detail-calcul"
          render={({
            history,
            match: {
              params: { section },
            },
          }) => <FAQSectionDetailCalcul history={history} section={section as FAQSectionType} />}
        />

        <Route
          exact
          path="/part/:part/question/:indexQuestion"
          render={({
            history,
            match: {
              params: { part, indexQuestion },
            },
          }) => <FAQQuestion history={history} part={part as FAQPartType} indexQuestion={Number(indexQuestion)} />}
        />
      </Switch>
*/}
        <FAQFooter />
      </Box>
    </Box>
  )

  /*      
  return (
    <Route
      render={route => {
        const location = (route as FAQRouteComponentProps).location
        const locationFAQ = {
          pathname: mapDefaultPathnameToFAQPathname(location),
          search: "",
          hash: "",
          state: undefined,
        }
      return (
          <Box as="aside" id="search" role="search" bg="white">
            <FAQHeader location={locationFAQ} closeMenu={closeMenu} />
            <Box
              p={6}
              overflowY="auto"
              maxHeight="100vh"
              sx={{ WebkitOverflowScrolling: "touch" }}
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
                    "/tableauDeBord/me-connecter",
                    "/tableauDeBord/mes-entreprises",
                    "/tableauDeBord/mon-profil",
                  ]}
                  exact
                  render={() => <FAQHome />}
                />

                
                <Route path={["/", "/simulateur/:code/informations-entreprise"]} exact render={() => <FAQHome />} />

                
                <Route
                  path={["/", "/simulateur/:code/informations-declarant"]}
                  exact
                  render={() => <FAQHome />}
                />

                
                <Route
                  path={["/", "/simulateur/:code/declaration"]}
                  exact
                  render={() => <FAQHome />}
                />

                <Route
                  exact
                  path="/section/:section"
                  render={({
                    match: {
                      params: { section },
                    },
                  }) => <FAQSection section={section as FAQSectionType} />}
                />

                <Route
                  exact
                  path="/section/:section/detail-calcul"
                  render={({
                    history,
                    match: {
                      params: { section },
                    },
                  }) => (
                    <FAQSectionDetailCalcul
                      history={history}
                      section={section as FAQSectionType}
                    />
                  )}
                />

                <Route
                  exact
                  path="/part/:part/question/:indexQuestion"
                  render={({
                    history,
                    match: {
                      params: { part, indexQuestion },
                    },
                  }) => (
                    <FAQQuestion
                      history={history}
                      part={part as FAQPartType}
                      indexQuestion={Number(indexQuestion)}
                    />
                  )}
                />
              </Switch>

              <FAQFooter />
            </Box>
          </Box>
        })
      }}
    />
  )*/
}

export default FAQRouter
