import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type SimpleMarkdownProps = {
  content: string
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

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  // Highlight keywords trước khi render
  const highlightedContent = useMemo(() => highlightKeywords(content), [content])

  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings với spacing tốt hơn
          h1: ({ ...props }) => <h1 className="mt-4 mb-3 text-2xl leading-tight font-bold" {...props} />,
          h2: ({ ...props }) => <h2 className="mt-3 mb-2 text-xl leading-tight font-semibold" {...props} />,
          h3: ({ ...props }) => <h3 className="mt-3 mb-2 text-lg leading-tight font-semibold" {...props} />,
          h4: ({ ...props }) => <h4 className="mt-2 mb-1 text-base font-semibold" {...props} />,

          // Paragraphs với line height tốt hơn
          p: ({ ...props }) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,

          // Lists với styling đẹp hơn
          ul: ({ ...props }) => <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0" {...props} />,
          ol: ({ ...props }) => <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0" {...props} />,
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,

          // Code blocks - không có syntax highlighting
          code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
            const isInline = !className

            return isInline ? (
              <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-gray-800" {...props}>
                {children}
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
          strong: ({ ...props }) => <strong className="font-bold text-gray-900" {...props} />,
          em: ({ ...props }) => <em className="italic" {...props} />,

          // Blockquotes đẹp hơn
          blockquote: ({ ...props }) => (
            <blockquote className="my-4 border-l-4 border-gray-400 bg-gray-50 pl-4 text-gray-700 italic" {...props} />
          ),

          // Links với hover effect
          a: ({ ...props }) => (
            <a
              className="font-medium text-blue-600 underline decoration-2 underline-offset-2 transition-colors hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Tables với styling đẹp
          table: ({ ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-gray-300 last:my-0">
              <table className="min-w-full divide-y divide-gray-300" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-gray-100" {...props} />,
          tbody: ({ ...props }) => <tbody className="divide-y divide-gray-200 bg-white" {...props} />,
          th: ({ ...props }) => (
            <th
              className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase"
              {...props}
            />
          ),
          td: ({ ...props }) => <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900" {...props} />,
          tr: ({ ...props }) => <tr className="hover:bg-gray-50" {...props} />,

          // Horizontal rule
          hr: ({ ...props }) => <hr className="my-4 border-t border-gray-300" {...props} />,

          // Images
          img: ({ alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => (
            <img className="my-4 max-w-full rounded-lg shadow-md" alt={alt || ''} {...props} />
          )
        }}
      >
        {highlightedContent}
      </ReactMarkdown>
    </div>
  )
}

export default SimpleMarkdown
