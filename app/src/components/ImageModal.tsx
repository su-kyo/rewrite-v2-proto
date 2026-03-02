import { createPortal } from 'react-dom';

interface ImageModalProps {
  src: string;
  onClose: () => void;
}

export default function ImageModal({ src, onClose }: ImageModalProps) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="" className="modal-image" />
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}
