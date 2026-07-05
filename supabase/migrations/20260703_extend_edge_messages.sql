-- Extend edge_messages with LoRa telemetry fields and make cloud sync idempotent.
ALTER TABLE public.edge_messages
  ADD COLUMN IF NOT EXISTS origin_node_id text,   -- LoRa origin node if relayed (null = local to syncing node)
  ADD COLUMN IF NOT EXISTS rssi integer,          -- dBm measured at the receiving node
  ADD COLUMN IF NOT EXISTS distance_m integer;    -- estimated distance from log-distance path-loss model

-- The firmware retries the whole local sync queue on partial failure; this
-- makes repeated POSTs of the same (node_id, timestamp_ms) a no-op instead of
-- creating duplicate rows.
CREATE UNIQUE INDEX IF NOT EXISTS edge_messages_node_msg_uidx
  ON public.edge_messages (node_id, timestamp_ms);
