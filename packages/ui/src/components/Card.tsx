import React from "react";

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingMap: Record<string, string> = {
  sm: "12px",
  md: "20px",
  lg: "32px",
};

export function Card({
  title,
  children,
  className,
  padding = "md",
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    padding: paddingMap[padding],
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    marginTop: 0,
    marginBottom: "16px",
  };

  return (
    <div style={cardStyle} className={className}>
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </div>
  );
}
