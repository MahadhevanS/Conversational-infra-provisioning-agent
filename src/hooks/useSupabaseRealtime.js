import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export { supabase };

/**
 * Subscribe to INSERT events on a Supabase table with an optional filter.
 * Automatically unsubscribes on unmount.
 *
 * @param {string} table        - Table name e.g. "chat_messages"
 * @param {function} onInsert   - Callback receives the new row
 * @param {string|null} filter  - Postgrest filter e.g. "project_id=eq.abc-123"
 * @param {any[]} deps          - Extra deps that should re-subscribe the channel
 */
export function useRealtimeInsert(table, onInsert, filter = null, deps = []) {
  const callbackRef = useRef(onInsert);
  useEffect(() => { callbackRef.current = onInsert; }, [onInsert]);

  useEffect(() => {
    if (!filter && filter !== null) return; // wait until filter is ready

    const channelName = `${table}:${filter || "all"}:${Date.now()}`;
    const config = { event: "INSERT", schema: "public", table };
    if (filter) config.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", config, (payload) => {
        callbackRef.current(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, ...deps]);
}

/**
 * Subscribe to UPDATE events on a Supabase table.
 */
export function useRealtimeUpdate(table, onUpdate, filter = null, deps = []) {
  const callbackRef = useRef(onUpdate);
  useEffect(() => { callbackRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    const channelName = `${table}:update:${filter || "all"}:${Date.now()}`;
    const config = { event: "UPDATE", schema: "public", table };
    if (filter) config.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", config, (payload) => {
        callbackRef.current(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, ...deps]);
}
