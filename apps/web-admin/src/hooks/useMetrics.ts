import { useEffect, useState, useCallback } from 'react'

import { fetchDashboardMetrics, DashboardMetrics } from '../lib/api'

export const useMetrics = (autoRefresh = false, intervalMs = 30000) => {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const metrics = await fetchDashboardMetrics()
      setData(metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMetrics()

    if (autoRefresh) {
      const intervalId = setInterval(loadMetrics, intervalMs)
      return () => clearInterval(intervalId)
    }
  }, [autoRefresh, intervalMs, loadMetrics])

  return { data, loading, error, refresh: loadMetrics }
}
