/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth, useLayoutType } from "../components/GridContext";
import Page from "../components/Page";
import ActionBar from "../components/ActionBar";
import { Fragment, useState } from "react";
import { Form, useField } from "react-final-form";
import FormSubmit from "../components/FormSubmit";
import { sendValidationEmail } from "../utils/api";
import Input, { hasFieldError } from "../components/Input";
import { required, validateEmail } from "../utils/formHelpers";
import ButtonAction from "../components/ButtonAction";

interface Props {
  code: string;
  tagLine?: string;
  reason?: string;
}

function AskEmail({ code, tagLine, reason}: Props) {
  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (formData: any) => {
    setLoading(true);
    setErrorMessage(undefined);
    sendValidationEmail(formData.email, code)
      .then(({ jsonBody }) => {
        setLoading(false);
        setSubmitted(true);
      })
      .catch((error) => {
        setLoading(false);
        setSubmitted(false);
        setErrorMessage(
          "Erreur lors de l'envoi de l'email de validation, est-ce que l'email est valide ?"
        );
      });
  };

  return (
    <Page title="Validation de l'email">
      <div css={css({ width })}>
        {tagLine && <h2>{tagLine}</h2>}
        <Form onSubmit={onSubmit}>
          {({ handleSubmit, hasValidationErrors, submitFailed, values }) =>
            submitted ? (
              <Fragment>
                <p>
                  Vous allez recevoir un mail sur l'adresse email que vous avez
                  indiquée à l'étape précédente.
                </p>

                <p css={styles.warning}>
                  Ouvrez ce mail et cliquez sur le lien de validation.
                </p>

                <p>
                  Si vous ne recevez pas ce mail sous peu, il se peut que
                  l'email saisi (<strong>{values.email}</strong>) soit
                  incorrect, ou bien que le mail ait été déplacé dans votre
                  dossier de courriers indésirables ou dans le dossier SPAM.
                  <br />
                  <br />
                  En cas d'échec, la procédure devra être reprise avec un autre
                  email.
                </p>
                <br />
                <br />
                <ButtonAction
                  onClick={() => setSubmitted(false)}
                  label="Modifier l'email"
                />
              </Fragment>
            ) : (
              <Fragment>
                { reason && <Fragment><p>{ reason }</p><br/></Fragment>}

                <p>
                  L’email saisi doit être valide. Il sera celui sur lequel sera adressé l’accusé de réception en fin de procédure et celui qui vous permettra d'accéder à votre déclaration une fois validée et transmise.
                  <br />
                  <br />
                  Attention : en cas d'email erroné, vous ne pourrez pas remplir
                  le formulaire ou accéder à votre déclaration déjà transmise.
                </p>

                <form onSubmit={handleSubmit} css={styles.body}>
                  <FieldEmail />
                  {errorMessage && <p css={styles.error}>{errorMessage}</p>}

                  <ActionBar>
                    <FormSubmit
                      hasValidationErrors={hasValidationErrors}
                      submitFailed={submitFailed}
                      loading={loading}
                    />
                  </ActionBar>
                </form>
              </Fragment>
            )
          }
        </Form>

        <div css={styles.imageContainer}>
          <div css={styles.image} />
        </div>
      </div>
    </Page>
  );
}

const validate = (value: string) => {
  const requiredError = required(value);
  const emailError = validateEmail(value);

  if (!requiredError && !emailError) {
    return undefined;
  } else {
    return { required: requiredError, validateEmail: emailError };
  }
};

function FieldEmail() {
  const field = useField("email", { validate });
  const error = hasFieldError(field.meta);

  return (
    <Fragment>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        email
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} />
      </div>
      <p css={styles.error}>{error && "l’adresse mail n’est pas valide"}</p>
    </Fragment>
  );
}

const styles = {
  imageContainer: css({
    marginTop: 160,
    height: 151,
    width: 384,
    position: "relative",
  }),
  image: css({
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    left: -(globalStyles.grid.gutterWidth * 2),
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-home-simulator.svg)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
  }),
  body: css({
    width: 405,
    marginTop: 46,
  }),
  label: css({
    fontSize: 14,
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
  }),
  warning: css({
    fontWeight: "bold",
    margin: "1em",
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
};

export default AskEmail;
