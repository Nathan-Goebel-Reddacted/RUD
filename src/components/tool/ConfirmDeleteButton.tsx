import { useState, useEffect } from "react";

type Props = {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  className?: string;
};

export default function ConfirmDeleteButton({
  onConfirm,
  label = "Delete",
  confirmLabel = "Are you sure?",
  className,
}: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 10_000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const handleClick = () => {
    if (!confirming) { setConfirming(true); return; }
    onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`d-block w-full${className ? ` ${className}` : ""}`}
      style={{
        color: "#e05252",
        borderColor: "#e05252",
        background: confirming ? "rgba(224,82,82,0.15)" : undefined,
      }}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}
