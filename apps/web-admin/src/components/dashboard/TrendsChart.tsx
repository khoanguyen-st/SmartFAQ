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

  return (
    <>
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Weekly Activity</h2>
        </div>

        <hr className="mb-4 border-gray-200" />

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
