import { useCallback, useEffect, useState } from 'react'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { fetchWeeklyTrends, TrendDataPoint } from '../../lib/api'

interface TrendsChartProps {
  refreshKey?: number
}

const TrendsChart = ({ refreshKey = 0 }: TrendsChartProps) => {
  const [data, setData] = useState<TrendDataPoint[]>([])
  const [loading, setLoading] = useState(false)

  const loadTrends = useCallback(() => {
    setLoading(true)
    fetchWeeklyTrends(7)
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching trends:', error))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadTrends()
  }, [loadTrends, refreshKey])

  const openModal = useCallback(() => {
    // TODO: Implement modal functionality
  }, [])

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Weekly Activity</h2>
          <button
            onClick={openModal}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition duration-150 ease-in-out hover:bg-indigo-700"
          >
            Upload Document
          </button>
        </div>

        <hr className="mb-4 border-gray-100" />

        <div className="h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="period" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={false} />
                <Line type="monotone" dataKey="questions" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  )
}

export default TrendsChart
