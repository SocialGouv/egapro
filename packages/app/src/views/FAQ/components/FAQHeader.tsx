/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Switch, Route, RouteComponentProps } from "react-router-dom";

function FAQHeaderBackButton({
  history,
  label
}: {
  history: RouteComponentProps["history"];
  label: string;
}) {
  return (
    <button css={styles.buttonBack} onClick={() => history.goBack()}>
      <span css={styles.backIcon}>◀</span> {label}
    </button>
  );
}

function FAQHeader({
  location
}: {
  location: RouteComponentProps["location"];
}) {
  return (
    <div css={styles.container}>
      <div css={styles.aroundTitle}>
        <Switch location={location}>
          <Route
            exact
            path="/section/:section"
            render={({ history }) => (
              <FAQHeaderBackButton
                history={history}
                label="voir toute l’aide"
              />
            )}
          />
          <Route
            exact
            path="/section/:section/question/:indexQuestion"
            render={({ history }) => (
              <FAQHeaderBackButton history={history} label="retour" />
            )}
          />
        </Switch>
      </div>
      <span css={styles.title}>Aide</span>
      <div css={styles.aroundTitle} />
    </div>
  );
}

const styles = {
  container: css({
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1px solid #EFECEF",
    marginRight: 29,
    marginLeft: 29
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 18
  }),
  aroundTitle: css({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 100
  }),
  buttonBack: css({
    all: "unset",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "none"
  }),
  backIcon: css({
    fontSize: 8
  })
};

export default FAQHeader;
