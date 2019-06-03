/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { Route, Switch } from "react-router-dom";

import FAQHeader from "./components/FAQHeader";

import FAQHome from "./FAQHome";
import FAQSection from "./FAQSection";

function FAQ() {
  return (
    <div css={styles.container}>
      <FAQHeader />

      <div css={styles.content}>
        <Switch>
          <Route path="/" exact render={() => <FAQHome />} />
          <Route
            path="/effectifs"
            render={() => <FAQSection section="champApplication" />}
          />
          <Route
            path="/indicateur1"
            render={() => <FAQSection section="periodeReference" />}
          />
          <Route
            path="/indicateur2"
            render={() => (
              <img
                css={css({ width: 375 })}
                src={process.env.PUBLIC_URL + "/faq-fake-indic2.jpg"}
              />
            )}
          />
          <Route
            path="/indicateur3"
            render={() => (
              <img
                css={css({ width: 375 })}
                src={process.env.PUBLIC_URL + "/faq-fake-indic3.jpg"}
              />
            )}
          />
          <Route
            path="/indicateur4"
            render={() => (
              <img
                css={css({ width: 375 })}
                src={process.env.PUBLIC_URL + "/faq-fake-indic4.jpg"}
              />
            )}
          />
          <Route
            path="/indicateur5"
            render={() => (
              <img
                css={css({ width: 375 })}
                src={process.env.PUBLIC_URL + "/faq-fake-indic5.jpg"}
              />
            )}
          />
          <Route
            path="/recapitulatif"
            render={() => (
              <img
                css={css({ width: 375 })}
                src={process.env.PUBLIC_URL + "/faq-fake-recap.jpg"}
              />
            )}
          />
        </Switch>
        {/*<div css={css({ marginBottom: 26 })}>
          <FAQTitle>Champ d'application et entrée en vigueur</FAQTitle>
        </div>

        <FAQSearchBox />

        <div
          css={css({
            marginTop: 14,
            marginBottom: 14,
            display: "flex",
            flexDirection: "column"
          })}
        >
          <FAQSectionRow
            title="Champ d'application et entrée en vigueur"
            detail="4 articles"
          />
          <FAQSectionRow
            title="Périeffectifs à prendre en compte pour le calcul des indicateurs de référence"
            detail="6 articles"
          />
        </div>*/}
      </div>
    </div>
  );
}

const styles = {
  container: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    paddingRight: 29,
    paddingLeft: 29
  }),
  content: css({
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    paddingTop: 26
  })
};

export default FAQ;
