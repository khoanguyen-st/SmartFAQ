import QueryLogTable from "../components/logs/QueryLogTable";

const LogsPage = () => {
  return (
    <section className="logs-page">
      <header className="logs-page__header">
        <h2>Query Logs</h2>
        <p>Search, filter, and export chatbot interactions.</p>
      </header>
      <QueryLogTable />
    </section>
  );
};

export default LogsPage;
