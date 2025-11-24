import { useMetrics } from '@/hooks/useMetrics'

const KPIGrid = () => {
  const { data, loading } = useMetrics()

  const kpis = [
    { 
      title: 'Questions Today', 
      value: data?.questions_today ?? '0'
    },
    { 
      title: 'Avg Response Time', 
      value: data?.avg_response_time_ms ? `${data.avg_response_time_ms} ms` : '0 ms'
    },
    { 
      title: 'Fallback Rate', 
      value: data?.fallback_rate ? `${(data.fallback_rate * 100).toFixed(1)}%` : '0%'
    },
    { 
      title: 'Active Documents', 
      value: data?.active_documents ?? '0'
    }
  ]

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(kpi => (
        <div key={kpi.title} className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
          <p className="text-sm text-slate-600">{kpi.title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {loading ? '...' : kpi.value}
          </p>
        </div>
      ))}
    </section>
  )
}

export default KPIGrid
