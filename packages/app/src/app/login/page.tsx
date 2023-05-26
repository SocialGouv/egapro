"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { signIn } from "next-auth/react";
import { useRef } from "react";

const LoginPage = () => {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async evt => {
          evt.preventDefault();
          const formData = new FormData(formRef.current ?? void 0);
          const email = formData.get("email");
          const ret = await signIn("email", { email, redirect: false });
          console.log("=====", ret);
        }}
      >
        <Input
          label="Email"
          nativeInputProps={{
            type: "email",
            name: "email",
          }}
        />
        <Button>Login</Button>
      </form>
      <br />
      <hr />
      <Button
        onClick={evt => {
          evt.preventDefault();
          void signIn("moncomptepro", { redirect: false });
        }}
      >
        Mon Compte Pro
      </Button>
    </>
  );
};

export default LoginPage;
