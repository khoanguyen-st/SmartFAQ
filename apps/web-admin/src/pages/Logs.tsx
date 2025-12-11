import QueryLogTable from '../components/logs/QueryLogTable'

const LogsPage = () => {
  return (
    <section className="flex h-[calc(100vh-81px)] flex-col gap-6 overflow-auto bg-white p-6">
      <header>
        <div className="pl-2">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">Query Logs</h2>
          <p className="text-base text-slate-600">Search, filter, and export chatbot interactions.</p>
        </div>
      </header>
      <QueryLogTable />
    </section>
  )
}

export default LogsPage
