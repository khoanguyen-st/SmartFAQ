import { useMemo, useState } from 'react'

interface QueryLog {
  id: string
  question: string
  confidence: number
  fallback: boolean
  lang: string
  timestamp: string
}

const sample: QueryLog[] = []

const QueryLogTable = () => {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    return sample.filter(log => log.question.toLowerCase().includes(search.toLowerCase()))
  }, [search])

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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No log entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default QueryLogTable
