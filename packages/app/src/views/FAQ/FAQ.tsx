/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { Route, Switch } from "react-router-dom";

import FAQHeader from "./components/FAQHeader";

import FAQHome from "./FAQHome";
import FAQSection from "./FAQSection";
import FAQQuestion from "./FAQQuestion";

function FAQ() {
  return (
    <Route
      render={({ location }) => {
        console.log(location);
        const locationFAQ = {
          pathname:
            location.state && location.state.faq
              ? location.state.faq
              : location.pathname,
          search: "",
          hash: "",
          state: undefined
        };
        return (
          <div css={styles.container}>
            <FAQHeader location={locationFAQ} />

            <div css={styles.content} key={locationFAQ.pathname}>
              <Switch location={locationFAQ}>
                <Route path="/" exact render={() => <FAQHome />} />

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
                  path="/section/:section/question/:indexQuestion"
                  render={({
                    history,
                    match: {
                      params: { section, indexQuestion }
                    }
                  }) => (
                    <FAQQuestion
                      history={history}
                      section={section}
                      indexQuestion={indexQuestion}
                    />
                  )}
                />

                <Route
                  path="/effectifs"
                  render={() => <FAQSection section="effectifs" />}
                />
                <Route
                  path="/indicateur1"
                  render={() => <FAQSection section="indicateur1" />}
                />
                <Route
                  path="/indicateur2"
                  render={() => <FAQSection section="indicateur2et3" />}
                />
                <Route
                  path="/indicateur3"
                  render={() => <FAQSection section="periodeReference" />}
                />
                <Route
                  path="/indicateur4"
                  render={() => <FAQSection section="indicateur4" />}
                />
                <Route
                  path="/indicateur5"
                  render={() => <FAQSection section="champApplication" />}
                />
                <Route
                  path="/recapitulatif"
                  render={() => <FAQSection section="publication" />}
                />
              </Switch>
            </div>
          </div>
        );
      }}
    />
  );
}

const styles = {
  container: css({
    flex: 1,
    display: "flex",
    flexDirection: "column"
  }),
  content: css({
    overflowY: "auto",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "column",
    paddingRight: 29,
    paddingLeft: 29,
    paddingTop: 26
  })
};

export default FAQ;
