import { useEffect, useMemo, useState } from 'react'
import { fetchLogs } from '@/lib/api'

interface QueryLog {
  id: string
  question: string
  confidence: number
  fallback: boolean
  lang: string
  timestamp: string
}

const QueryLogTable = () => {
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const data = await fetchLogs()
        setLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs')
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  const filtered = useMemo(() => {
    return logs.filter(log => log.question.toLowerCase().includes(search.toLowerCase()))
  }, [logs, search])

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search question"
          className="focus:border-primary-600 focus:ring-primary-600/20 rounded-lg border border-indigo-200 px-3.5 py-2.5 text-base focus:ring-2 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            type="button"
            className="cursor-pointer rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Filter
          </button>
          <button
            type="button"
            className="bg-primary-600 hover:bg-primary-700 cursor-pointer rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-white"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-indigo-50 text-xs tracking-wider text-slate-700 uppercase">
            <tr>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Timestamp</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Question</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Confidence</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Fallback</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Language</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-red-400">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No log entries yet.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filtered.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-3">{log.question}</td>
                  <td className="px-3 py-3">{(log.confidence * 100).toFixed(1)}%</td>
                  <td className="px-3 py-3">{log.fallback ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3">{log.lang}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default QueryLogTable
