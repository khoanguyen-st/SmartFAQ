import { useMemo, useState } from "react";

interface QueryLog {
  id: string;
  question: string;
  confidence: number;
  fallback: boolean;
  lang: string;
  timestamp: string;
}

const sample: QueryLog[] = [];

const QueryLogTable = () => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    return sample.filter((log) => log.question.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="logs-card">
      <div className="logs-card__controls">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search question"
        />
        <div className="logs-card__actions">
          <button type="button" className="logs-card__button logs-card__button--outline">
            Filter
          </button>
          <button type="button" className="logs-card__button logs-card__button--primary">
            Export CSV
          </button>
        </div>
      </div>
      <div className="logs-card__table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Question</th>
              <th>Confidence</th>
              <th>Fallback</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="logs-card__empty">
                  No log entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueryLogTable;
