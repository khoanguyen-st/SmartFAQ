import { useEffect, useState } from "react";

import { fetchMetrics } from "../lib/api";

export const useMetrics = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log(loading);
    fetchMetrics()
      .then(setData)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
