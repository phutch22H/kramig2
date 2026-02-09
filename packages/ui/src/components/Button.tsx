import React from "react";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
  },
  secondary: {
    backgroundColor: "#ffffff",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  danger: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "1px solid #dc2626",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#374151",
    border: "1px solid transparent",
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: "4px 12px", fontSize: "12px" },
  md: { padding: "8px 16px", fontSize: "14px" },
  lg: { padding: "12px 24px", fontSize: "16px" },
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  onClick,
  className,
  type = "button",
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background-color 150ms, border-color 150ms",
    lineHeight: 1.5,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      style={baseStyle}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
