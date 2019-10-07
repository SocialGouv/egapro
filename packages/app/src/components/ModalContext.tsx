/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useRef, useContext, createContext, ReactNode } from "react";
import ReactDOM from "react-dom";

// Context

const defaultValue: { container: null | Element } = { container: null };

export const ModalContext = createContext(defaultValue);

// Provider

function ModalProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef(null);
  const container = containerRef.current;

  return (
    <ModalContext.Provider value={{ container }}>
      {children}
      <div ref={containerRef} />
    </ModalContext.Provider>
  );
}

export default ModalProvider;

// Component

export function Modal({
  children,
  isOpen,
  onRequestClose
}: {
  children: ReactNode;
  isOpen: boolean;
  onRequestClose: () => void;
}) {
  const { container } = useContext(ModalContext);

  const child = (
    <div css={[styles.container, isOpen && styles.containerOpen]}>
      <div
        css={[styles.overlay, isOpen && styles.overlayOpen]}
        onClick={onRequestClose}
      />
      <div css={[styles.modal, isOpen && styles.modalOpen]}>{children}</div>
    </div>
  );

  return container ? ReactDOM.createPortal(child, container) : null;
}

const styles = {
  container: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    display: "flex",

    visibility: "hidden",
    transition: "visibility 0ms linear 250ms"
  }),
  containerOpen: css({
    visibility: "visible",
    transitionDelay: "0ms"
  }),
  overlay: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(6px)",

    opacity: 0,
    transition: "opacity 175ms ease-in-out 75ms"
  }),
  overlayOpen: css({
    opacity: 1,
    transitionDelay: "0ms"
  }),
  modal: css({
    position: "relative",
    margin: "auto",

    transition:
      "opacity 250ms ease-in-out 0ms, transform 250ms ease-in-out 0ms",
    opacity: 0,
    transform: "scale(0.8)"
  }),
  modalOpen: css({
    opacity: 1,
    transform: "initial"
  })
};
