/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useContext,
  createContext,
  ReactNode
} from "react";
import ReactDOM from "react-dom";

// Context

export const ModalContext = createContext({
  container: null
});

// Provider

function ModalProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  const containerRef = useRef(null);
  const container = containerRef.current;

  useEffect(() => setIsMounted(true), []);

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
    transition: "visibility 0ms linear 200ms"
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
    backdropFilter: "blur(10px)",

    opacity: 0,
    transition: "opacity 150ms ease-in-out 50ms"
  }),
  overlayOpen: css({
    opacity: 1,
    transitionDelay: "0ms"
  }),
  modal: css({
    position: "relative",
    margin: "auto",

    transition:
      "opacity 200ms ease-in-out 0ms, transform 200ms ease-in-out 0ms",
    opacity: 0,
    transform: "scale(0.8)"
  }),
  modalOpen: css({
    opacity: 1,
    transform: "initial"
  })
};
