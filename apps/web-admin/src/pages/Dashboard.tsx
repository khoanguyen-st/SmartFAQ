import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import KPIGrid from '../components/dashboard/KPIGrid'
import TrendsChart from '../components/dashboard/TrendsChart'
import UnansweredPanel from '../components/dashboard/UnansweredPanel'
import FAQPanel from '../components/dashboard/FAQPanel'

const DashboardPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with controls */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-base text-slate-600">Monitor system performance and user activity</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-refresh (30s)
          </label>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <KPIGrid autoRefresh={autoRefresh} refreshKey={refreshKey} />
      <TrendsChart refreshKey={refreshKey} />

      {/* FAQ Panel - Popular and Trending Questions */}
      <FAQPanel refreshKey={refreshKey} />

      <UnansweredPanel refreshKey={refreshKey} />
    </div>
  )
}

export default DashboardPage
