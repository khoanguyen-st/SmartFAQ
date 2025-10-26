const items: Array<{ question: string; status: "In Progress" | "Resolved" }> = [];

const UnansweredPanel = () => {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Unanswered Questions</h2>
        <button type="button" className="dashboard-link">
          Export CSV
        </button>
      </div>
      <div className="dashboard-card__content">
        {items.length === 0 && <p>No pending questions yet.</p>}
      </div>
    </section>
  );
};

export default UnansweredPanel;
