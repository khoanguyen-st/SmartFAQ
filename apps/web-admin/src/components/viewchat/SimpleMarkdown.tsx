import React, { useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type SimpleMarkdownProps = {
  content: string
  enableHighlight?: boolean
  sources?: Array<{ title: string }> // Thêm prop sources
  onSourceHover?: (sourceIndex: number | null) => void // Callback khi hover
  onSourceClick?: (sourceIndex: number) => void // Thêm prop mới
}

/**
 * Highlight các từ khóa quan trọng trong text bằng markdown bold
 */
const highlightKeywords = (text: string): string => {
  if (!text) return text

  let highlighted = text

  // Kiểm tra xem text đã được highlight chưa
  const isAlreadyHighlighted = (text: string): boolean => {
    return text.startsWith('**') && text.endsWith('**')
  }

  // Kiểm tra xem vị trí có nằm trong markdown bold không
  const isInMarkdownBold = (text: string, index: number): boolean => {
    // Tìm ** gần nhất trước index
    const beforeText = text.substring(0, index)
    const lastBoldStart = beforeText.lastIndexOf('**')
    if (lastBoldStart === -1) return false

    // Kiểm tra xem có ** đóng sau index không
    const afterBoldStart = text.indexOf('**', lastBoldStart + 2)
    return afterBoldStart !== -1 && afterBoldStart > index
  }

  // Pattern cho cụm từ nhiều từ - sắp xếp từ dài đến ngắn
  const multiWordPatterns = [
    /\b(Trường Đại học FPT|Đại học Greenwich)\b/gi,
    /\b(học kỳ|kỳ thi|tín chỉ|học phí)\b/gi,
    /\b(giấy tờ|hồ sơ|chứng chỉ)\b/gi
  ]

  // Pattern cho ngày tháng
  const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/gi
  // Pattern cho từ đơn - sắp xếp từ dài đến ngắn
  const singleWordPatterns = [/\b(Công nghệ thông tin|Trí tuệ nhân tạo)\b/gi]

  // Áp dụng các pattern với kiểm tra kỹ hơn
  const highlightPattern = (pattern: RegExp, _replacement: string) => {
    highlighted = highlighted.replace(pattern, (match, ...args) => {
      // Nếu đã được highlight rồi thì bỏ qua
      if (isAlreadyHighlighted(match)) {
        return match
      }

      // Lấy index của match trong text gốc
      const matchIndex = args[args.length - 2] // offset của match

      // Kiểm tra xem có nằm trong markdown bold không
      if (isInMarkdownBold(highlighted, matchIndex)) {
        return match
      }

      // Kiểm tra xem có nằm trong code block không (giữa ``` hoặc `)
      const beforeMatch = highlighted.substring(0, matchIndex)
      const codeBlockOpen = beforeMatch.lastIndexOf('```')
      const codeBlockClose = highlighted.indexOf('```', matchIndex)
      if (codeBlockOpen !== -1 && (codeBlockClose === -1 || codeBlockClose > matchIndex)) {
        return match
      }

      const inlineCodeOpen = beforeMatch.lastIndexOf('`')
      const inlineCodeClose = highlighted.indexOf('`', matchIndex)
      if (inlineCodeOpen !== -1 && inlineCodeClose !== -1 && inlineCodeClose > matchIndex) {
        // Kiểm tra xem có phải inline code không (không phải code block)
        const beforeInline = highlighted.substring(0, inlineCodeOpen)
        const lastCodeBlock = beforeInline.lastIndexOf('```')
        if (lastCodeBlock === -1 || highlighted.indexOf('```', lastCodeBlock + 3) < inlineCodeOpen) {
          return match
        }
      }

      return `**${match}**`
    })
  }

  // Áp dụng cụm từ nhiều từ (từ dài đến ngắn)
  multiWordPatterns.forEach(pattern => {
    highlightPattern(pattern, '**$1**')
  })

  // Áp dụng ngày tháng
  highlightPattern(datePattern, '**$1**')
  // Áp dụng từ đơn (từ dài đến ngắn)
  singleWordPatterns.forEach(pattern => {
    highlightPattern(pattern, '**$1**')
  })

  return highlighted
}

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({
  content,
  enableHighlight = false, // Thêm prop này và default = false
  sources = [],
  onSourceHover,
  onSourceClick // Thêm prop mới
}) => {
  // Highlight keywords trước khi render - chỉ khi enableHighlight = true
  const highlightedContent = useMemo(() => {
    return enableHighlight ? highlightKeywords(content) : content
  }, [content, enableHighlight])

  // Helper function để process children và replace source references
  const processSourceReferences = useCallback(
    (node: React.ReactNode): React.ReactNode | React.ReactNode[] => {
      if (typeof node === 'string') {
        // Split string by source reference markers (case insensitive)
        const parts = node.split(/(\[SOURCE_REF_\d+\])/gi)
        return parts.map((part, idx) => {
          const match = part.match(/\[SOURCE_REF_(\d+)\]/i)
          if (match) {
            const sourceIndex = parseInt(match[1], 10) - 1 // Convert to 0-based
            if (sourceIndex >= 0 && sourceIndex < sources.length) {
              return (
                <span
                  key={`source-ref-${idx}-${match[1]}`}
                  className="source-reference inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700 transition-colors hover:bg-blue-500 hover:text-white"
                  onMouseEnter={() => onSourceHover?.(sourceIndex)}
                  onMouseLeave={() => onSourceHover?.(null)}
                  onClick={() => onSourceClick?.(sourceIndex)} // Thêm onClick
                >
                  {match[1]}
                </span>
              )
            }
          }
          return part
        })
      }

      if (React.isValidElement(node)) {
        const element = node as React.ReactElement<{ children?: React.ReactNode }>
        if (element.props.children) {
          return React.cloneElement(element, {
            children: React.Children.map(element.props.children, processSourceReferences)
          } as { children?: React.ReactNode })
        }
        return node
      }

      if (Array.isArray(node)) {
        return node.map((child, idx) => <React.Fragment key={idx}>{processSourceReferences(child)}</React.Fragment>)
      }

      return node
    },
    [sources, onSourceHover, onSourceClick]
  ) // Thêm onSourceClick vào dependencies

  // Process content để wrap các số reference
  const processedContent = useMemo(() => {
    if (!sources || sources.length === 0) return highlightedContent

    let processed = highlightedContent

    // Trước tiên, normalize các [SOURCE_REF_X] format từ backend (case insensitive)
    // Đảm bảo format nhất quán
    processed = processed.replace(/\[SOURCE_REF_(\d+)\]/gi, (match, numStr) => {
      const num = parseInt(numStr, 10)
      if (num >= 1 && num <= sources.length) {
        return `[SOURCE_REF_${num}]`
      }
      return match
    })

    // Sau đó, tìm các số đơn lẻ và replace nếu nằm trong range
    const referencePattern = /\b([1-9]\d*)\b(?=\s|$|[.,;:!?])/g

    processed = processed.replace(referencePattern, (match, numStr, offset) => {
      const num = parseInt(numStr, 10)
      // Chỉ xử lý nếu số nằm trong range của sources (1 đến sources.length)
      if (num >= 1 && num <= sources.length) {
        // Kiểm tra xem có phải là số trong markdown list không (ví dụ: "1. item")
        const afterMatch = processed.substring(offset + match.length, offset + match.length + 2)

        // Nếu có dấu chấm ngay sau số, có thể là markdown list, bỏ qua
        if (afterMatch.trim().startsWith('.')) {
          return match
        }

        // Kiểm tra xem đã có [SOURCE_REF_X] chưa (tránh double replace)
        const beforeText = processed.substring(Math.max(0, offset - 20), offset)
        if (beforeText.includes('[SOURCE_REF_')) {
          return match
        }

        return `[SOURCE_REF_${num}]`
      }
      return match
    })

    return processed
  }, [highlightedContent, sources])

  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings với spacing tốt hơn
          h1: ({ children, ...props }) => (
            <h1 className="mt-4 mb-3 text-2xl leading-tight font-bold" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mt-3 mb-2 text-xl leading-tight font-semibold" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mt-3 mb-2 text-lg leading-tight font-semibold" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="mt-2 mb-1 text-base font-semibold" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </h4>
          ),

          // Paragraphs với line height tốt hơn
          p: ({ children, ...props }) => {
            const processedChildren = React.Children.map(children, processSourceReferences)
            return (
              <p className="mb-3 leading-relaxed last:mb-0" {...props}>
                {processedChildren}
              </p>
            )
          },

          // Lists với styling đẹp hơn
          ul: ({ children, ...props }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </li>
          ),

          // Code blocks - không có syntax highlighting
          code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
            const isInline = !className

            return isInline ? (
              <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-gray-800" {...props}>
                {React.Children.map(children, processSourceReferences)}
              </code>
            ) : (
              <code
                className="block overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100"
                {...props}
              >
                {children}
              </code>
            )
          },

          pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => {
            return (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-0 text-sm last:mb-0" {...props}>
                {children}
              </pre>
            )
          },

          // Strong và emphasis - tăng font weight cho highlighted text
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </em>
          ),

          // Blockquotes đẹp hơn
          blockquote: ({ children, ...props }) => (
            <blockquote className="my-4 border-l-4 border-gray-400 bg-gray-50 pl-4 text-gray-700 italic" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </blockquote>
          ),

          // Links với hover effect
          a: ({ children, ...props }) => (
            <a
              className="font-medium text-blue-600 underline decoration-2 underline-offset-2 transition-colors hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {React.Children.map(children, processSourceReferences)}
            </a>
          ),

          // Tables với styling đẹp
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-gray-300 last:my-0">
              <table className="min-w-full divide-y divide-gray-300" {...props}>
                {React.Children.map(children, processSourceReferences)}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-100" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-gray-200 bg-white" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </tbody>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </td>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-gray-50" {...props}>
              {React.Children.map(children, processSourceReferences)}
            </tr>
          ),

          // Horizontal rule
          hr: ({ ...props }) => <hr className="my-4 border-t border-gray-300" {...props} />,

          // Images
          img: ({ alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => (
            <img className="my-4 max-w-full rounded-lg shadow-md" alt={alt || ''} {...props} />
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default SimpleMarkdown
