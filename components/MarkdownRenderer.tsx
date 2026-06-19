"use client";

import { isValidElement, useCallback, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return extractTextContent(node.props.children);

  return "";
}

function normalizeMarkdown(content: string) {
  return content.replace(/^(#{1,6})(?=\S)/gm, "$1 ");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute right-3 top-3 rounded-full border border-rose-100/16 bg-[#160813]/78 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-rose-100/72 opacity-0 shadow-[0_0_24px_rgba(251,113,133,0.14)] backdrop-blur transition hover:border-rose-100/32 hover:text-rose-50 group-hover:opacity-100"
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body max-w-none text-base leading-8 text-starlight/76">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 {...props} className="mb-5 mt-8 font-display text-4xl leading-tight text-starlight sm:text-5xl">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="mb-4 mt-8 font-display text-3xl leading-tight text-rose-50">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="mb-3 mt-7 font-display text-2xl leading-tight text-comet">
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className="my-4 text-starlight/72">
              {children}
            </p>
          ),
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="text-rose-100 underline decoration-rose-200/30 underline-offset-4 transition hover:text-comet hover:decoration-comet/60"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="my-4 list-disc space-y-2 pl-6 marker:text-rose-200/72">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="my-4 list-decimal space-y-2 pl-6 marker:text-comet/80">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="pl-1 text-starlight/72">
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className="my-6 rounded-2xl border-l-4 border-rose-200/38 bg-rose-100/[0.06] px-5 py-3 text-rose-50/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isBlock = /language-/.test(className || "");

            if (isBlock) {
              return (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            }

            return (
              <code
                {...props}
                className="rounded-md border border-rose-100/12 bg-rose-100/[0.09] px-1.5 py-0.5 font-mono text-[0.92em] text-rose-50"
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => {
            const textContent = extractTextContent(children);

            return (
              <div className="group relative my-6 overflow-hidden rounded-2xl border border-white/12 bg-[#07040a] shadow-[0_18px_60px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <pre {...props} className="overflow-x-auto p-5 text-sm leading-7">
                  {children}
                </pre>
                {textContent ? <CopyButton text={textContent} /> : null}
              </div>
            );
          },
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border border-white/12 bg-black/18">
              <table {...props} className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th {...props} className="border-b border-rose-100/18 bg-rose-100/[0.07] px-4 py-3 text-left font-medium text-rose-50">
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="border-b border-white/8 px-4 py-3 text-starlight/68">
              {children}
            </td>
          ),
          hr: (props) => <hr {...props} className="my-8 border-white/10" />,
          input: ({ ...props }) => (
            <input
              {...props}
              disabled
              className="mr-2 h-4 w-4 rounded border-rose-100/24 accent-rose-300 align-[-0.18em]"
            />
          )
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
