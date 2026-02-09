import React from "react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label?: string;
  error?: string;
  id: string;
}

export function Input({ label, error, id, style, ...rest }: InputProps) {
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "6px",
    border: error ? "1px solid #dc2626" : "1px solid #d1d5db",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    lineHeight: 1.5,
    ...style,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#dc2626",
    marginTop: "2px",
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <input id={id} style={inputStyle} {...rest} />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
