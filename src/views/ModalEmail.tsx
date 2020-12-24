/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState, Fragment, ReactNode } from "react";
import { Form, useField } from "react-final-form";

import { sendEmailIndicatorsDatas } from "../utils/api";
import { required, validateEmail } from "../utils/formHelpers";

import Input, { hasFieldError } from "../components/Input";
import ErrorMessage from "../components/ErrorMessage";
import FormSubmit from "../components/FormSubmit";
import ActionBar from "../components/ActionBar";
import ActionLink from "../components/ActionLink";
import { IconClose } from "../components/Icons";
import globalStyles from "../utils/globalStyles";

const validate = (value: string) => {
  const requiredError = required(value);
  const emailError = validateEmail(value);

  if (!requiredError && !emailError) {
    return undefined;
  } else {
    return { required: requiredError, validateEmail: emailError };
  }
};

interface Props {
  closeModal: () => void;
  code: string;
}

function ModalEmail({ closeModal, code }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(undefined);

  const onSubmit = (formData: any) => {
    setLoading(true);
    sendEmailIndicatorsDatas(code, formData.email)
      .then(() => {
        setLoading(false);
        closeModal();
      })
      .catch(error => {
        setLoading(false);
        const errorMessage =
          (error.jsonBody && error.jsonBody.message) ||
          "Erreur lors de l'envoi de l'email";
        setErrorMessage(errorMessage);
      });
  };

  if (!loading && errorMessage) {
    return (
      <ModalContainer closeModal={closeModal}>
        {ErrorMessage(errorMessage)}
      </ModalContainer>
    );
  }

  return (
    <ModalContainer closeModal={closeModal}>
      <p css={styles.title}>
        Revenez sur vos données à tout moment. Renseignez votre e-mail.
      </p>
      <p css={styles.text}>
        Nous générons un code spécialement pour vous. Pour pouvoir réaccéder à
        tout moment à votre calcul, renseignez votre e-mail afin que nous
        puissions vous envoyer votre lien.
      </p>

      <Form onSubmit={onSubmit}>
        {({ handleSubmit, hasValidationErrors, submitFailed }) => (
          <form onSubmit={handleSubmit} css={styles.body}>
            <FieldEmail />

            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                loading={loading}
              />
              <ActionLink onClick={closeModal} style={styles.actionLink}>
                continuer sans donner de mail
              </ActionLink>
            </ActionBar>
          </form>
        )}
      </Form>
    </ModalContainer>
  );
}

interface ModalProps {
  children: ReactNode;
  closeModal: () => void;
}

function ModalContainer({ children, closeModal }: ModalProps) {
  return (
    <div css={styles.container}>
      <div css={styles.image} />
      <div css={styles.icon} onClick={closeModal}>
        <IconClose />
      </div>
      {children}
    </div>
  );
}

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

  body: css({
    width: 405,
    marginTop: 46
  }),
  label: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex"
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px"
  }),
  actionLink: css({
    marginLeft: 14
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
