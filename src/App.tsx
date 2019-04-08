/** @jsx jsx */
import { css, jsx } from "@emotion/core";

function App() {
  return (
    <div>
      <header css={styles.header}>
        <p>EGAPRO - Prototype</p>
      </header>
    </div>
  );
}

const styles = {
  header: css({
    backgroundColor: "#282c34",
    minHeight: "10vh",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "calc(10px + 2vmin)",
    color: "white",
    textAlign: "center"
  })
};

export default App;
