import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Tailwind styles for each markdown element in the AI review. */
const components: Components = {
    h1: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h3>,
    h3: ({ children }) => <h4 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h4>,
    h4: ({ children }) => <h5 className="mt-3 mb-1 text-xs font-semibold first:mt-0">{children}</h5>,
    p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
            {children}
        </blockquote>
    ),
    // Block code is wrapped in <pre>; inline code is not.
    pre: ({ children }) => (
        <pre className="my-2 overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs [&_code]:bg-transparent [&_code]:p-0">
            {children}
        </pre>
    ),
    code: ({ children, className }) => (
        <code className={`rounded bg-muted px-1 py-0.5 font-mono text-xs ${className ?? ""}`}>
            {children}
        </code>
    ),
    table: ({ children }) => (
        <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">{children}</table>
        </div>
    ),
    th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-medium">{children}</th>,
    td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
    hr: () => <hr className="my-4 border-border" />,
};

/** Renders AI review markdown. Raw HTML in the markdown is not rendered. */
export function ReviewMarkdown({ markdown }: { markdown: string }) {
    return (
        <div className="text-xs text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
