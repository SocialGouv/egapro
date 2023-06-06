"use client";

import { usePathname, useRouter } from "next/navigation";
import { type DOMAttributes, type PropsWithChildren, useRef } from "react";

export interface SimpleSubmitFormProps extends PropsWithChildren {
  /** Default to current pathname */
  action?: string | ((formData: FormData) => void);
  noValidate?: boolean;
  /** If `true`, `router.replace` is used instead of `router.push` */
  replace?: boolean;
}

/**
 * Simple form wrapper with a direct submit via html form's `action` prop.
 */
export const SimpleSubmitForm = ({ children, action, replace = false, noValidate = false }: SimpleSubmitFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = event => {
    event.preventDefault();
    const formData = [...new FormData(formRef.current ?? void 0)] as Array<[string, string]>;
    const query = new URLSearchParams(formData).toString();

    router[replace ? "replace" : "push"](`${action ?? pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <form
      ref={formRef}
      noValidate={noValidate}
      {...(typeof action === "function" ? { action } : { onSubmit: handleSubmit })}
    >
      {children}
    </form>
  );
};
