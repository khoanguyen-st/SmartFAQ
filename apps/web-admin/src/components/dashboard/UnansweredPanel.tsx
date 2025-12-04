import { useCallback, useEffect, useState } from 'react'

import { fetchUnansweredQuestions, UnansweredQuestion } from '../../lib/api'

interface UnansweredPanelProps {
  refreshKey?: number
}

const UnansweredPanel = ({ refreshKey = 0 }: UnansweredPanelProps) => {
  const [items, setItems] = useState<UnansweredQuestion[]>([])
  const [loading, setLoading] = useState(false)

  const loadUnanswered = useCallback(() => {
    setLoading(true)
    fetchUnansweredQuestions(10)
      .then(response => setItems(response.items))
      .catch(error => console.error('Error fetching unanswered questions:', error))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUnanswered()
  }, [loadUnanswered, refreshKey])

  const handleExportCSV = () => {
    if (items.length === 0) return

    // Create CSV content
    const headers = ['ID', 'Question', 'Reason', 'Channel', 'Created At', 'Status']
    const csvRows = [
      headers.join(','),
      ...items.map(item =>
        [
          item.id,
          `"${item.question.replace(/"/g, '""')}"`,
          `"${item.reason.replace(/"/g, '""')}"`,
          item.channel || 'N/A',
          new Date(item.createdAt).toISOString(),
          item.status
        ].join(',')
      )
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `unanswered-questions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Unanswered Questions</h2>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={items.length === 0}
          className="text-primary-600 hover:text-primary-700 border-none bg-transparent font-semibold disabled:text-slate-400"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-base text-slate-600">
          <p>No pending questions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="max-w-md truncate px-4 py-3 text-sm text-slate-900" title={item.question}>
                    {item.question}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.reason}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.channel || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default UnansweredPanel
