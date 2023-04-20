"use client";

import { useRouter } from "next/navigation";
import { type DOMAttributes, type PropsWithChildren, useRef } from "react";

export interface SimpleSubmitFormProps extends PropsWithChildren {
  action: string;
  noValidate?: boolean;
  replace?: boolean;
}

export const SimpleSubmitForm = ({ children, action, replace = false, noValidate = false }: SimpleSubmitFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = event => {
    event.preventDefault();
    const formData = [...new FormData(formRef.current ?? void 0)] as Array<[string, string]>;
    const query = new URLSearchParams(formData).toString();

    router[replace ? "replace" : "push"](`${action}${query ? `?${query}` : ""}`);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate={noValidate}>
      {children}
    </form>
  );
};
