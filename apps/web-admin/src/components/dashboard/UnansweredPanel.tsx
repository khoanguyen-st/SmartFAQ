const items: Array<{ question: string; status: 'In Progress' | 'Resolved' }> = []

const UnansweredPanel = () => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Unanswered Questions</h2>
        <button
          type="button"
          className="text-primary-600 hover:text-primary-700 border-none bg-transparent font-semibold"
        >
          Export CSV
        </button>
      </div>
      <div className="text-base text-slate-600">{items.length === 0 && <p>No pending questions yet.</p>}</div>
    </section>
  )
}

export default UnansweredPanel
