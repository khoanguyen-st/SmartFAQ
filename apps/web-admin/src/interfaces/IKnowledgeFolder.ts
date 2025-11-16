export interface IKnowledgeFolder {
  id: number
  title: string
  name: string
  description?: string
  date?: string
  createdAt: string
  updatedAt: string
  sources?: number[]
}
