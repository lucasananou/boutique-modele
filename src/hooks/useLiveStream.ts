"use client";

import { useEffect } from "react";
import { useLiveStore } from "@/store/live";

export function useLiveStream(enabled = true) {
  const { setSnapshot, setConnected } = useLiveStore();

  useEffect(() => {
    if (!enabled) return;
    let es: EventSource;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/live/stream");

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "snapshot" || msg.type === "update") {
            setSnapshot({
              sessions: msg.sessions,
              stats: msg.stats,
              events: msg.events,
            });
          }
        } catch {
          // malformed message, on ignore
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [enabled, setSnapshot, setConnected]);
}
