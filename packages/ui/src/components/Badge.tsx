import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

const variantStyles: Record<string, React.CSSProperties> = {
  success: { backgroundColor: "#dcfce7", color: "#166534" },
  warning: { backgroundColor: "#fef9c3", color: "#854d0e" },
  danger: { backgroundColor: "#fee2e2", color: "#991b1b" },
  info: { backgroundColor: "#dbeafe", color: "#1e40af" },
  default: { backgroundColor: "#f3f4f6", color: "#374151" },
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "9999px",
    lineHeight: 1.5,
    ...variantStyles[variant],
  };

  return <span style={style}>{children}</span>;
}
