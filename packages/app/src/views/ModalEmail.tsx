/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { RouteComponentProps } from "react-router-dom";

import { postIndicatorsDatas } from "../utils/api";

import ButtonAction from "../components/ButtonAction";
import Button from "../components/Button";
import globalStyles from "../utils/globalStyles";

function ModalEmail({ closeModal }: { closeModal: () => void }) {
  // const [loading, setLoading] = useState(false);
  // const onClick = () => {
  //   setLoading(true);
  //   postIndicatorsDatas({}).then(({ jsonBody: { id } }) => {
  //     setLoading(false);
  //     history.push(`/simulateur/${id}`);
  //   });
  // };
  return <div css={styles.container} onClick={closeModal} />;
}

const styles = {
  container: css({
    width: 640,
    height: 440,
    backgroundColor: "white",
    borderRadius: 12
  })
};

export default ModalEmail;
