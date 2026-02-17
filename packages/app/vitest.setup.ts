import "@testing-library/jest-dom/vitest";

import * as mockRouter from "next-router-mock";
import React from "react";
import { vi } from "vitest";

const useRouter = mockRouter.useRouter;

process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL =
  "https://identite.proconnect.gouv.fr/manage-organizations";

// Use vi.hoisted so the factory is available in the hoisted scope for vi.mock calls
const dsfrMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    const mockComponent = (props: Record<string, unknown>) =>
      ReactLocal.createElement("div", { "data-testid": "mock-component", ...props });
    const mockFunction = () => ({});

    function Alert(props: { className?: string; title?: string; description?: unknown; severity?: string }) {
      return ReactLocal.createElement(
        "div",
        { "data-testid": "mock-alert", className: props?.className, role: "alert" },
        props?.title ? ReactLocal.createElement("h2", null, props.title) : null,
        props?.description ? props.description : null,
      );
    }

    function Breadcrumb(props: {
      homeLinkProps?: { href: string };
      segments?: Array<{ label: string; linkProps?: { href: string } }>;
      currentPageLabel?: string;
    }) {
      const children: unknown[] = [];

      if (props?.homeLinkProps) {
        children.push(ReactLocal.createElement("a", { href: props.homeLinkProps.href, key: "home" }, "Accueil"));
      }

      if (props?.segments && Array.isArray(props.segments)) {
        props.segments.forEach((segment: { label: string; linkProps?: { href: string } }, idx: number) => {
          children.push(
            ReactLocal.createElement(
              "span",
              { key: `seg-${idx}` },
              ReactLocal.createElement("a", { href: segment.linkProps?.href }, segment.label),
              idx < (props.segments?.length ?? 0) - 1 ? " > " : null,
            ),
          );
        });
      }

      children.push(ReactLocal.createElement("span", { key: "current" }, props?.currentPageLabel));

      return ReactLocal.createElement("nav", null, ...children);
    }

    const fr = {
      cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
      spacing: (value: number) => `${value}rem`,
    };

    function cx(...args: unknown[]) {
      return fr.cx(...args);
    }

    const exportsObj = {
      Button: mockComponent,
      Alert,
      Breadcrumb,
      ButtonsGroup: mockComponent,
      Card: mockComponent,
      Checkbox: mockComponent,
      Input: mockComponent,
      Modal: mockComponent,
      Select: mockComponent,
      Table: mockComponent,
      Tabs: mockComponent,
      ToggleSwitch: mockComponent,
      RadioButtons: mockComponent,
      Badge: mockComponent,
      CallOut: mockComponent,
      Download: mockComponent,
      Header: mockComponent,
      HeaderQuickAccessItem: mockComponent,
      Highlight: mockComponent,
      MainNavigation: mockComponent,
      Notice: mockComponent,
      Stepper: mockComponent,
      createModal: mockFunction,
      createConsentManagement: mockFunction,
      startReactDsfr: mockFunction,
      fr,
      cx,
      useColors: mockFunction,
      useIsDark: () => false,
      breakpoints: {
        xs: "0px",
        sm: "576px",
        md: "768px",
        lg: "992px",
        xl: "1248px",
      },
    };

    return {
      ...exportsObj,
      default: { ...exportsObj },
    };
  };
});

// Create a factory for simple component mocks (for sub-module imports)
const dsfrComponentMockFactory = vi.hoisted(() => {
  return (componentName: string) => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ReactLocal = require("react");
      const Component = (props: Record<string, unknown>) =>
        ReactLocal.createElement("div", { "data-testid": `mock-${componentName.toLowerCase()}`, ...props });
      Component.displayName = componentName;
      return {
        default: Component,
        [componentName]: Component,
        __esModule: true,
      };
    };
  };
});

// Alert needs special handling for title/description rendering
const dsfrAlertMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function Alert(props: { className?: string; title?: string; description?: unknown; severity?: string }) {
      return ReactLocal.createElement(
        "div",
        { "data-testid": "mock-alert", className: props?.className, role: "alert" },
        props?.title ? ReactLocal.createElement("h2", null, props.title) : null,
        props?.description ? props.description : null,
      );
    }
    return {
      default: Alert,
      Alert,
      __esModule: true,
    };
  };
});

// Breadcrumb needs special handling
const dsfrBreadcrumbMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function Breadcrumb(props: {
      homeLinkProps?: { href: string };
      segments?: Array<{ label: string; linkProps?: { href: string } }>;
      currentPageLabel?: string;
    }) {
      const children: unknown[] = [];
      if (props?.homeLinkProps) {
        children.push(ReactLocal.createElement("a", { href: props.homeLinkProps.href, key: "home" }, "Accueil"));
      }
      if (props?.segments && Array.isArray(props.segments)) {
        props.segments.forEach((segment: { label: string; linkProps?: { href: string } }, idx: number) => {
          children.push(
            ReactLocal.createElement(
              "span",
              { key: `seg-${idx}` },
              ReactLocal.createElement("a", { href: segment.linkProps?.href }, segment.label),
              idx < (props.segments?.length ?? 0) - 1 ? " > " : null,
            ),
          );
        });
      }
      children.push(ReactLocal.createElement("span", { key: "current" }, props?.currentPageLabel));
      return ReactLocal.createElement("nav", null, ...children);
    }
    return {
      default: Breadcrumb,
      Breadcrumb,
      __esModule: true,
    };
  };
});

// RadioButtons needs to render actual radio inputs for testing
const dsfrRadioButtonsMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function RadioButtons(props: {
      legend?: string;
      orientation?: string;
      options?: Array<{ label: string; nativeInputProps?: Record<string, unknown> }>;
    }) {
      return ReactLocal.createElement(
        "fieldset",
        null,
        props?.legend ? ReactLocal.createElement("legend", null, props.legend) : null,
        ...(props?.options || []).map(
          (option: { label: string; nativeInputProps?: Record<string, unknown> }, idx: number) =>
            ReactLocal.createElement(
              "label",
              { key: idx },
              ReactLocal.createElement("input", { type: "radio", ...option.nativeInputProps }),
              option.label,
            ),
        ),
      );
    }
    return {
      default: RadioButtons,
      RadioButtons,
      __esModule: true,
    };
  };
});

// Select needs to render actual select for testing
const dsfrSelectMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function Select(props: {
      label?: string;
      nativeSelectProps?: Record<string, unknown>;
      state?: string;
      stateRelatedMessage?: string;
      disabled?: boolean;
      children?: unknown;
    }) {
      const selectId = (props.nativeSelectProps?.id || props.nativeSelectProps?.name || "select") as string;
      return ReactLocal.createElement(
        "div",
        null,
        props?.label
          ? ReactLocal.createElement(
              "label",
              { htmlFor: selectId },
              props.label,
            )
          : null,
        ReactLocal.createElement(
          "select",
          { id: selectId, disabled: props.disabled, ...props.nativeSelectProps },
          props.children,
        ),
      );
    }
    return {
      default: Select,
      Select,
      __esModule: true,
    };
  };
});

// Input needs to render actual input for testing
const dsfrInputMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function Input(props: {
      label?: string;
      nativeInputProps?: Record<string, unknown>;
      state?: string;
      stateRelatedMessage?: string;
      textArea?: boolean;
      iconId?: string;
    }) {
      const inputId = props.nativeInputProps?.id || props.nativeInputProps?.name || "input";
      return ReactLocal.createElement(
        "div",
        null,
        props?.label ? ReactLocal.createElement("label", { htmlFor: inputId }, props.label) : null,
        props?.textArea
          ? ReactLocal.createElement("textarea", { id: inputId, ...props.nativeInputProps })
          : ReactLocal.createElement("input", { id: inputId, ...props.nativeInputProps }),
      );
    }
    return {
      default: Input,
      Input,
      __esModule: true,
    };
  };
});

// Button mock - renders <a> when linkProps provided, <button> otherwise
// Passes through title, className, style, and nativeButtonProps to the DOM element
const dsfrButtonMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    function Button(props: {
      linkProps?: { href?: string; [key: string]: unknown };
      nativeButtonProps?: Record<string, unknown>;
      children?: unknown;
      disabled?: boolean;
      title?: string;
      className?: string;
      style?: Record<string, unknown>;
      type?: string;
      [key: string]: unknown;
    }) {
      const { linkProps, nativeButtonProps, children, disabled, title, className, style, type, ...rest } = props;
      // Filter out non-DOM props
      const _iconId = rest.iconId;
      const _priority = rest.priority;
      const _size = rest.size;
      void _iconId; void _priority; void _size;
      if (linkProps) {
        return ReactLocal.createElement("a", { href: linkProps.href, role: "link", title, className, style, ...linkProps }, children);
      }
      return ReactLocal.createElement("button", { disabled, title, className, style, type: type || "button", ...nativeButtonProps }, children);
    }
    return {
      default: Button,
      Button,
      __esModule: true,
    };
  };
});

// tools/cx mock
const dsfrCxMockFactory = vi.hoisted(() => {
  return () => {
    const cx = (...args: unknown[]) => args.filter(Boolean).join(" ");
    return {
      default: cx,
      cx,
      __esModule: true,
    };
  };
});

// Modal mock with createModal
const dsfrModalMockFactory = vi.hoisted(() => {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactLocal = require("react");
    const Modal = (props: Record<string, unknown>) =>
      ReactLocal.createElement("div", { "data-testid": "mock-modal", ...props });
    const createModal = () => ({
      Component: Modal,
      open: () => {},
      close: () => {},
      buttonProps: {},
    });
    return {
      default: Modal,
      Modal,
      createModal,
      __esModule: true,
    };
  };
});

// Main DSFR module mocks
vi.mock("@codegouvfr/react-dsfr", dsfrMockFactory);
vi.mock("@codegouvfr/react-dsfr/index", dsfrMockFactory);

// Sub-module mocks - prevent loading the full DSFR library
vi.mock("@codegouvfr/react-dsfr/Alert", dsfrAlertMockFactory);
vi.mock("@codegouvfr/react-dsfr/Breadcrumb", dsfrBreadcrumbMockFactory);
vi.mock("@codegouvfr/react-dsfr/RadioButtons", dsfrRadioButtonsMockFactory);
vi.mock("@codegouvfr/react-dsfr/Select", dsfrSelectMockFactory);
vi.mock("@codegouvfr/react-dsfr/Input", dsfrInputMockFactory);
vi.mock("@codegouvfr/react-dsfr/Button", dsfrButtonMockFactory);
vi.mock("@codegouvfr/react-dsfr/Modal", dsfrModalMockFactory);
vi.mock("@codegouvfr/react-dsfr/tools/cx", dsfrCxMockFactory);
// ButtonsGroup needs to render actual button elements from the buttons prop
vi.mock("@codegouvfr/react-dsfr/ButtonsGroup", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLocal = require("react");
  function ButtonsGroup(props: {
    buttons?: Array<{
      children?: unknown;
      linkProps?: { href?: string };
      disabled?: boolean;
      type?: string;
      priority?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }) {
    return ReactLocal.createElement(
      "div",
      { "data-testid": "mock-buttonsgroup" },
      ...(props?.buttons || []).map(
        (
          btn: {
            children?: unknown;
            linkProps?: { href?: string };
            disabled?: boolean;
            type?: string;
            [key: string]: unknown;
          },
          idx: number,
        ) => {
          if (btn.linkProps) {
            return ReactLocal.createElement("a", { key: idx, href: btn.linkProps.href, role: "link" }, btn.children);
          }
          return ReactLocal.createElement(
            "button",
            { key: idx, type: btn.type || "button", disabled: btn.disabled },
            btn.children,
          );
        },
      ),
    );
  }
  return {
    default: ButtonsGroup,
    ButtonsGroup,
    __esModule: true,
  };
});
vi.mock("@codegouvfr/react-dsfr/Badge", dsfrComponentMockFactory("Badge"));
// CallOut needs to render children and buttonProps
vi.mock("@codegouvfr/react-dsfr/CallOut", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLocal = require("react");
  function CallOut(props: {
    children?: unknown;
    buttonProps?: { linkProps?: { href?: string }; children?: unknown };
    [key: string]: unknown;
  }) {
    return ReactLocal.createElement(
      "div",
      { "data-testid": "mock-callout" },
      props.children,
      props.buttonProps
        ? props.buttonProps.linkProps
          ? ReactLocal.createElement("a", { href: props.buttonProps.linkProps.href, role: "link" }, props.buttonProps.children)
          : ReactLocal.createElement("button", null, props.buttonProps.children)
        : null,
    );
  }
  return {
    default: CallOut,
    CallOut,
    __esModule: true,
  };
});
// Card needs to render title, desc, and footer
vi.mock("@codegouvfr/react-dsfr/Card", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLocal = require("react");
  function Card(props: {
    title?: string;
    desc?: unknown;
    footer?: unknown;
    [key: string]: unknown;
  }) {
    return ReactLocal.createElement(
      "div",
      { "data-testid": "mock-card" },
      props.title ? ReactLocal.createElement("h3", null, props.title) : null,
      props.desc ? ReactLocal.createElement("div", null, props.desc) : null,
      props.footer ? ReactLocal.createElement("div", null, props.footer) : null,
    );
  }
  return {
    default: Card,
    Card,
    __esModule: true,
  };
});
vi.mock("@codegouvfr/react-dsfr/Download", dsfrComponentMockFactory("Download"));
vi.mock("@codegouvfr/react-dsfr/Header", dsfrComponentMockFactory("Header"));
vi.mock("@codegouvfr/react-dsfr/Highlight", dsfrComponentMockFactory("Highlight"));
vi.mock("@codegouvfr/react-dsfr/MainNavigation", dsfrComponentMockFactory("MainNavigation"));
vi.mock("@codegouvfr/react-dsfr/Notice", dsfrComponentMockFactory("Notice"));
vi.mock("@codegouvfr/react-dsfr/Stepper", dsfrComponentMockFactory("Stepper"));
vi.mock("@codegouvfr/react-dsfr/Table", dsfrComponentMockFactory("Table"));
vi.mock("@codegouvfr/react-dsfr/ToggleSwitch", dsfrComponentMockFactory("ToggleSwitch"));
vi.mock("@codegouvfr/react-dsfr/consentManagement", () => ({
  createConsentManagement: () => ({
    ConsentBannerAndConsentManagement: () => null,
    useConsent: () => ({}),
  }),
  __esModule: true,
}));
vi.mock("@codegouvfr/react-dsfr/spa", () => ({
  startReactDsfr: () => {},
  __esModule: true,
}));

vi.mock("next/navigation", () => ({
  ...mockRouter,
  useSearchParams: () => {
    const router = useRouter();
    const path = router.query;
    return new URLSearchParams(path as Record<string, string>);
  },
  usePathname: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: vi.fn(() => []),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockReturnThis(),
  jwtVerify: vi.fn(),
  compactDecrypt: vi.fn(),
}));

// Silence console.error in tests
console.error = (..._args: unknown[]) => {
  return;
};

// Mock styled-jsx to prevent useInsertionEffect error
vi.mock("styled-jsx/style", () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock server-only to prevent "This module cannot be imported from a Client Component module" error
vi.mock("server-only", () => ({}));
