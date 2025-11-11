import QueryLogTable from '../components/logs/QueryLogTable'

const LogsPage = () => {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Query Logs</h2>
        <p className="text-base text-slate-600">Search, filter, and export chatbot interactions.</p>
      </header>
      <QueryLogTable />
    </section>
  )
}

export default LogsPage
