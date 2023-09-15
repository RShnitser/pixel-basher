import { ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
};

const Modal = ({ children, isOpen }: ModalProps) => {
  return (
    <>
      {isOpen ? (
        <div className="modal">
          <div className="modal-content">{children}</div>
        </div>
      ) : null}
    </>
  );
};

export default Modal;
