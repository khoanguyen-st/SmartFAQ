import { useEffect, useState } from 'react'
import { fetchQueryLogs, QueryLogItem } from '@/lib/api'
import { ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'

const QueryLogTable = () => {
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState<QueryLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Filter state
  const [showFallbackOnly, setShowFallbackOnly] = useState(false)
  const [selectedLang, setSelectedLang] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<string>('')

  // Modal state
  const [selectedLog, setSelectedLog] = useState<QueryLogItem | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const data = await fetchQueryLogs({
          page: currentPage,
          pageSize,
          search: search || undefined,
          fallback: showFallbackOnly || undefined,
          lang: selectedLang || undefined,
          channel: selectedChannel || undefined
        })
        setLogs(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs')
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [currentPage, search, showFallbackOnly, selectedLang, selectedChannel])

  const handleClearFilters = () => {
    setSearch('')
    setShowFallbackOnly(false)
    setSelectedLang('')
    setSelectedChannel('')
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-5 border border-slate-100 rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={event => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search in answers..."
            className="focus:border-primary-600 focus:ring-primary-600/20 rounded-lg border border-blue-200 px-3.5 py-2.5 text-base focus:ring-2 focus:outline-none"
          />
          <div className="flex gap-3"></div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFallbackOnly}
              onChange={e => {
                setShowFallbackOnly(e.target.checked)
                setCurrentPage(1)
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-700">Fallback only</span>
          </label>

          <select
            value={selectedLang}
            onChange={e => {
              setSelectedLang(e.target.value)
              setCurrentPage(1)
            }}
            className="focus:border-primary-600 focus:ring-primary-600/20 rounded-lg border border-blue-200 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Languages</option>
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
          </select>

          <select
            value={selectedChannel}
            onChange={e => {
              setSelectedChannel(e.target.value)
              setCurrentPage(1)
            }}
            className="focus:border-primary-600 focus:ring-primary-600/20 rounded-lg border border-blue-200 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="widget">Widget</option>
            <option value="chatstudent">Chat Student</option>
            <option value="chatstaff">Chat Staff</option>
          </select>

          {(showFallbackOnly || selectedLang || selectedChannel) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>
          )}

          <div className="ml-auto text-sm text-slate-600">Total: {total} logs</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-blue-50 text-xs tracking-wider text-slate-700 uppercase">
            <tr>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Timestamp</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Question</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Confidence</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Relevance</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Fallback</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Language</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Channel</th>
              <th className="border-b border-slate-200 px-3 py-3 text-left">Response Time</th>
              <th className="border-b border-slate-200 px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-red-400">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && logs.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  No log entries found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="max-w-md truncate px-3 py-3" title={log.question}>
                    {log.question}
                  </td>
                  <td className="px-3 py-3">
                    {log.confidence ? (
                      <span className={log.confidence >= 0.7 ? 'font-semibold text-green-600' : 'text-orange-600'}>
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {log.relevance ? (
                      <span className={log.relevance >= 0.7 ? 'font-semibold text-blue-600' : 'text-amber-600'}>
                        {(log.relevance * 100).toFixed(1)}%
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {log.fallback ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 uppercase">{log.lang}</td>
                  <td className="px-3 py-3">{log.channel || 'N/A'}</td>
                  <td className="px-3 py-3">{log.responseMs ? `${log.responseMs}ms` : 'N/A'}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">Query Details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Timestamp</p>
                  <p className="mt-1 text-sm text-slate-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Session ID</p>
                  <p className="mt-1 font-mono text-sm text-slate-900">{selectedLog.sessionId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Confidence</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedLog.confidence ? (
                      <span className={selectedLog.confidence >= 0.7 ? 'text-green-600' : 'text-orange-600'}>
                        {(selectedLog.confidence * 100).toFixed(1)}%
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Relevance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedLog.relevance ? (
                      <span className={selectedLog.relevance >= 0.7 ? 'text-blue-600' : 'text-amber-600'}>
                        {(selectedLog.relevance * 100).toFixed(1)}%
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Response Time</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedLog.responseMs ? `${selectedLog.responseMs}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Language</p>
                  <p className="mt-1 text-sm text-slate-900 uppercase">{selectedLog.lang}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Channel</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedLog.channel || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Fallback</p>
                  <p className="mt-1">
                    {selectedLog.fallback ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        No
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Feedback</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedLog.feedback || 'None'}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">User Agent</p>
                  <p className="rounded-lg bg-slate-50 p-3 font-mono text-sm break-all text-slate-700">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {/* Question */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Question</p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm whitespace-pre-wrap text-slate-900">{selectedLog.question}</p>
                </div>
              </div>

              {/* Answer */}
              {selectedLog.answer && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Answer</p>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm whitespace-pre-wrap text-slate-900">{selectedLog.answer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueryLogTable
