import { ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  //close: () => void;
};

const Modal = ({ children, isOpen }: ModalProps) => {
  return (
    <>
      {isOpen ? (
        <div className="modal">
          {/* <div className="modal-dialog"> */}
          <div className="modal-content">
            {children}
            {/* <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button onClick ={() => close(false)} className="close">&times;</button>
                    </div> */}
            {/* <div className="modal-body">{children}</div> */}
          </div>
          {/* </div> */}
        </div>
      ) : null}
    </>
  );
};

export default Modal;
