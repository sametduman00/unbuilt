"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

// Markdown component overrides — same as was inline in HomeClient
const MD: Record<string, (props: any) => React.ReactElement> = {
  table: ({ children }) => (
    <div className="table-wrap"><table>{children}</table></div>
  ),
  strong: ({ children }) => <span>{children}</span>,
  hr: () => <></>,
  code: ({ className, children }) => {
    if (className) {
      return <pre><code className={className}>{children}</code></pre>;
    }
    return (
      <code style={{ background: "rgba(var(--clr-text-rgb),0.12)", color: "var(--clr-text-3)", padding: "0.1em 0.35em", borderRadius: 4, fontSize: "0.85em" }}>
        {children}
      </code>
    );
  },
};

export default function LazyMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
      {children}
    </ReactMarkdown>
  );
}
