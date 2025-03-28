"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
  const modalRoot = typeof window !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!modalRoot) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalRoot]);

  return modalRoot ? createPortal(children, modalRoot) : null;
}
