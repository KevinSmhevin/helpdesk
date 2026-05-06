CREATE OR REPLACE FUNCTION dashboard_total_tickets()
RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*) FROM ticket;
$$;

CREATE OR REPLACE FUNCTION dashboard_open_tickets()
RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*) FROM ticket WHERE status = 'open';
$$;

CREATE OR REPLACE FUNCTION dashboard_resolved_by_ai()
RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*) FROM ticket WHERE "resolvedByAI" = true;
$$;

CREATE OR REPLACE FUNCTION dashboard_avg_resolution_hours()
RETURNS double precision
LANGUAGE sql STABLE AS $$
  SELECT EXTRACT(EPOCH FROM AVG("resolvedAt" - "createdAt")) / 3600.0
  FROM ticket
  WHERE "resolvedAt" IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION dashboard_tickets_per_day()
RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    TO_CHAR(DATE("createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD'),
    COUNT(*)
  FROM ticket
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
  ORDER BY 1 ASC;
$$;
