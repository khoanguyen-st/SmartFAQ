import docxUrl from '@/assets/icons/docx.svg'
import fileUrl from '@/assets/icons/file.svg'
import mdUrl from '@/assets/icons/md.svg'
import pdfUrl from '@/assets/icons/pdf.svg'
import txtUrl from '@/assets/icons/txt.svg'
import React from 'react'

type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>

const makeImgComponent = (src: string, alt = ''): React.FC<ImgCompProps> => {
  return (props: ImgCompProps) => React.createElement('img', { src, alt, ...props })
}

const DocxIcon = makeImgComponent(docxUrl, 'doc')
const FileIcon = makeImgComponent(fileUrl, 'file')
const MDIcon = makeImgComponent(mdUrl, 'md')
const PDFIcon = makeImgComponent(pdfUrl, 'pdf')
const TXTIcon = makeImgComponent(txtUrl, 'txt')

export const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return PDFIcon
    case 'doc':
    case 'docx':
      return DocxIcon
    case 'txt':
      return TXTIcon
    case 'md':
    case 'markdown':
      return MDIcon
    default:
      return FileIcon
  }
}
