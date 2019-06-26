/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";

import { sendEmailIndicatorsDatas } from "../utils/api";

import ButtonAction from "../components/ButtonAction";
import Button from "../components/Button";
import { IconClose } from "../components/Icons";
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
  return (
    <div css={styles.container}>
      <div css={styles.icon} onClick={closeModal}>
        <IconClose />
      </div>
      <p css={styles.title}>
        Assurez-vous de ne pas perdre le lien de votre calcul, renseignez votre
        e-mail
      </p>
      <p css={styles.text}>
        Nous générons un code spécialement pour votre calcul. Pour pouvoir
        réaccéder à tout moment à votre calcul, laissez-nous votre e-mail afin
        que nous puissions vous envoyer votre code.
      </p>
      <div css={styles.image} />
    </div>
  );
}

const styles = {
  container: css({
    width: 640,
    height: 440,
    padding: `21px 60px 21px 19px`,
    position: "relative",

    backgroundColor: "#F6F7FF",
    borderRadius: 12
  }),
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  text: css({
    marginTop: 7,
    fontSize: 14,
    lineHeight: "17px"
  }),

  icon: css({
    position: "absolute",
    top: 7,
    right: 7,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  }),

  image: css({
    position: "absolute",
    right: 20,
    bottom: -1,
    height: 192,
    width: 304,
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-email.svg)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain"
  })
};

export default ModalEmail;
