import type { ReactNode } from "react";

type Props = {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export default function FormField({ label, error, children, className }: Props) {
  return (
    <div className={`d-block m-2${className ? ` ${className}` : ""}`}>
      {label && <div className="form-section-label">{label}</div>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
