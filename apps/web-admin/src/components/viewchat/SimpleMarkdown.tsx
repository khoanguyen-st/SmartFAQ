import React from 'react'

type SimpleMarkdownProps = {
  content: string
}

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  const lines = content.split('\n')

  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 mb-2">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  function flushCodeBlock() {
    if (codeLines.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-sm"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      codeLines = []
    }
  }

  function renderInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    let rest = text

    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/

    while (rest.length > 0) {
      const match = rest.match(regex)
      if (!match || match.index === undefined) {
        nodes.push(rest)
        break
      }

      const index = match.index
      if (index > 0) {
        nodes.push(rest.slice(0, index))
      }

      const token = match[0]
      if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(<strong key={nodes.length}>{token.slice(2, -2)}</strong>)
      } else if (token.startsWith('`') && token.endsWith('`')) {
        nodes.push(
          <code
            key={nodes.length}
            className="rounded bg-gray-100 px-1 py-0.5 text-sm"
          >
            {token.slice(1, -1)}
          </code>
        )
      } else if (token.startsWith('*') && token.endsWith('*')) {
        nodes.push(<em key={nodes.length}>{token.slice(1, -1)}</em>)
      }

      rest = rest.slice(index + token.length)
    }

    return nodes
  }

  lines.forEach((raw, lineIndex) => {
    const line = raw

    // code block ``` ... ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // đóng block
        inCodeBlock = false
        flushCodeBlock()
      } else {
        // mở block
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    // heading
    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${lineIndex}`} className="mb-2 text-xl font-semibold">
          {renderInline(line.slice(2))}
        </h1>
      )
      return
    }
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${lineIndex}`} className="mb-2 text-lg font-semibold">
          {renderInline(line.slice(3))}
        </h2>
      )
      return
    }
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${lineIndex}`} className="mb-1 text-base font-semibold">
          {renderInline(line.slice(4))}
        </h3>
      )
      return
    }

    // danh sách bullet: "- " hoặc "* "
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const itemText = line.trim().slice(2)
      listItems.push(
        <li key={`li-${lineIndex}`}>{renderInline(itemText)}</li>
      )
      return
    }

    // dòng trống
    if (line.trim() === '') {
      flushList()
      elements.push(<div key={`sp-${lineIndex}`} className="h-2" />)
      return
    }

    // paragraph bình thường
    flushList()
    elements.push(
      <p key={`p-${lineIndex}`} className="mb-1">
        {renderInline(line)}
      </p>
    )
  })

  // flush phần còn lại
  flushList()
  flushCodeBlock()

  return <>{elements}</>
}

export default SimpleMarkdown
