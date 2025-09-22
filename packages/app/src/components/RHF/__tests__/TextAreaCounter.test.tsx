import * as Sentry from "@sentry/nextjs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import { sanitizeClipboardText } from "../../../utils/errorHandling";
import { TextareaCounter, type TextareaCounterProps } from "../TextAreaCounter";

jest.mock("@codegouvfr/react-dsfr", () => ({
  fr: {
    cx: jest.fn().mockImplementation((...args) => args.join(" ")),
  },
  Input: ({ label, nativeTextAreaProps, state, stateRelatedMessage }) => (
    <div>
      <label>{label}</label>
      <textarea {...nativeTextAreaProps} data-testid="textarea" />
      {state === "error" && <span>{stateRelatedMessage}</span>}
    </div>
  ),
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

const Wrapper = ({ children, defaultValues = {} }) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("TextareaCounter", () => {
  const defaultProps: TextareaCounterProps = {
    label: "Test Label",
    fieldName: "testField",
    maxLength: 300,
    showRemainingCharacters: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render textarea with correct props", async () => {
    render(
      <Wrapper>
        <TextareaCounter {...defaultProps} placeholder="Enter text" />
      </Wrapper>,
    );

    const textarea = await screen.findByRole("textbox");
    expect(textarea).toHaveAttribute("placeholder", "Enter text");
    expect(textarea).toHaveAttribute("maxLength", "300");
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("300 caractères restants")).toBeInTheDocument();
  });

  it("should update remaining characters count", async () => {
    render(
      <Wrapper defaultValues={{ testField: "Hello" }}>
        <TextareaCounter {...defaultProps} showRemainingCharacters={true} />
      </Wrapper>,
    );

    expect(screen.getByText("295 caractères restants")).toBeInTheDocument();
  });

  it("should handle paste with valid text", async () => {
    render(
      <Wrapper defaultValues={{ testField: "" }}>
        <TextareaCounter {...defaultProps} />
      </Wrapper>,
    );

    const textarea = await screen.findByRole("textbox");
    const pastedText = "Hello World";

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => pastedText,
      },
    });

    await waitFor(() => {
      expect(textarea).toHaveValue("Hello World");
      expect(screen.getByText("289 caractères restants")).toBeInTheDocument();
    });
  });

  it("should fall back to default paste if sanitization removes all content", async () => {
    const mockSanitize = jest.spyOn({ sanitizeClipboardText }, "sanitizeClipboardText").mockReturnValue("");
    render(
      <Wrapper defaultValues={{ testField: "" }}>
        <TextareaCounter {...defaultProps} />
      </Wrapper>,
    );

    const textarea = await screen.findByRole("textbox");
    const pastedText = "\u001F\u200B"; // Caractères filtrés

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => pastedText,
      },
    });

    fireEvent.change(textarea, {
      target: { value: pastedText },
    });

    await waitFor(() => {
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Sanitization removed all content, falling back to default paste",
        expect.objectContaining({
          level: "warning",
          tags: { component: "TextareaCounter", action: "handlePaste" },
          extra: { fieldName: "testField", rawText: pastedText },
        }),
      );
      expect(textarea).toHaveValue(pastedText);
    });

    mockSanitize.mockRestore();
  });
});
