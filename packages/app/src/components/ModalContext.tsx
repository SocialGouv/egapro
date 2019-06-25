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

  const render = (
    <div css={styles.container}>
      <div css={styles.overlay} onClick={onRequestClose} />
      <div css={styles.modal}>{children}</div>
    </div>
  );

  return container && isOpen ? ReactDOM.createPortal(render, container) : null;
}

const styles = {
  container: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    display: "flex"
  }),
  overlay: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(10px)"
  }),
  modal: css({
    position: "relative",
    margin: "auto"
  })
};
