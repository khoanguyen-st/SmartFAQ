const kpis = [
  { title: 'Questions Today', value: '0' },
  { title: 'Avg Response Time', value: '0 ms' },
  { title: 'Fallback Rate', value: '0%' },
  { title: 'Active Documents', value: '0' }
]

const KPIGrid = () => {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(kpi => (
        <div key={kpi.title} className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
          <p className="text-sm text-slate-600">{kpi.title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</p>
        </div>
      ))}
    </section>
  )
}

export default KPIGrid
