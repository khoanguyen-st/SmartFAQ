import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SimpleMarkdownProps {
  content: string
}

type HeadingProps = React.ComponentPropsWithoutRef<'h1' | 'h2' | 'h3' | 'h4'>
type ParagraphProps = React.ComponentPropsWithoutRef<'p'>
type ListProps = React.ComponentPropsWithoutRef<'ul' | 'ol'>
type ListItemProps = React.ComponentPropsWithoutRef<'li'>
type CodeProps = React.ComponentPropsWithoutRef<'code'>
type PreProps = React.ComponentPropsWithoutRef<'pre'>
type QuoteProps = React.ComponentPropsWithoutRef<'blockquote'>
type AnchorProps = React.ComponentPropsWithoutRef<'a'>
type TableElementProps = React.ComponentPropsWithoutRef<'table'>
type TableSectionProps = React.ComponentPropsWithoutRef<'thead' | 'tbody'>
type TableRowProps = React.ComponentPropsWithoutRef<'tr'>
type TableHeaderProps = React.ComponentPropsWithoutRef<'th'>
type TableDataProps = React.ComponentPropsWithoutRef<'td'>
type HRProps = React.ComponentPropsWithoutRef<'hr'>
type ImageProps = React.ComponentPropsWithoutRef<'img'>

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children, ...props }: HeadingProps) => (
            <h1 className="mt-3 mb-2 text-lg leading-tight font-bold" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: HeadingProps) => (
            <h2 className="mt-3 mb-2 text-base leading-tight font-semibold" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: HeadingProps) => (
            <h3 className="mt-2 mb-1.5 text-sm leading-tight font-semibold" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }: HeadingProps) => (
            <h4 className="mt-2 mb-1 text-sm font-semibold" {...props}>
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children, ...props }: ParagraphProps) => (
            <p className="mb-2 leading-relaxed last:mb-0" {...props}>
              {children}
            </p>
          ),

          // Lists
          ul: ({ children, ...props }: ListProps) => (
            <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: ListProps) => (
            <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }: ListItemProps) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),

          // Code blocks
          code: ({ className, children, ...props }: CodeProps) => {
            const isInline = !className

            return isInline ? (
              <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-800" {...props}>
                {children}
              </code>
            ) : (
              <code
                className="block overflow-x-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-gray-100"
                {...props}
              >
                {children}
              </code>
            )
          },

          pre: ({ children, ...props }: PreProps) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-0 text-xs last:mb-0" {...props}>
              {children}
            </pre>
          ),

          // Strong and emphasis
          strong: ({ children, ...props }: HeadingProps) => (
            <strong className="font-bold text-gray-900" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }: HeadingProps) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),

          // Blockquotes
          blockquote: ({ children, ...props }: QuoteProps) => (
            <blockquote
              className="my-2 border-l-4 border-gray-400 bg-gray-50 py-2 pl-3 text-sm text-gray-700 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Links
          a: ({ children, ...props }: AnchorProps) => (
            <a
              className="font-medium text-blue-600 underline decoration-1 underline-offset-2 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children, ...props }: TableElementProps) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-gray-300 last:my-0">
              <table className="min-w-full divide-y divide-gray-300 text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }: TableSectionProps) => (
            <thead className="bg-gray-100" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }: TableSectionProps) => (
            <tbody className="divide-y divide-gray-200 bg-white" {...props}>
              {children}
            </tbody>
          ),
          th: ({ children, ...props }: TableHeaderProps) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }: TableDataProps) => (
            <td className="px-3 py-2 text-xs text-gray-900" {...props}>
              {children}
            </td>
          ),
          tr: ({ children, ...props }: TableRowProps) => (
            <tr className="hover:bg-gray-50" {...props}>
              {children}
            </tr>
          ),

          // Horizontal rule
          hr: ({ ...props }: HRProps) => <hr className="my-3 border-t border-gray-300" {...props} />,

          // Images
          img: ({ alt, ...props }: ImageProps) => (
            <img className="my-3 max-w-full rounded-lg shadow-md" alt={alt || ''} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default SimpleMarkdown
