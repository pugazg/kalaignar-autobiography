import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

// Central, lightweight network-status source. One NetInfo subscription for the whole
// app (screens read `useNetworkStatus()` instead of each subscribing separately).
//
// Three states, deliberately:
//   "unknown" — NetInfo hasn't resolved yet (initial). Never treated as offline.
//   "offline" — the device is *known* to have no connection (isConnected === false).
//   "online"  — the device reports a connection.
//
// We flip to "offline" only on a definite isConnected === false. A reachable-but-no-
// internet or a failing content server is NOT reported as "offline" here — those are
// surfaced truthfully by the screen that made the request (see OFFLINE_NETWORK.md).
// This is device-local state only; nothing about connectivity is transmitted anywhere.

export type NetworkStatus = "unknown" | "online" | "offline";

const Ctx = createContext<NetworkStatus>("unknown");

function toStatus(isConnected: boolean | null | undefined): NetworkStatus {
  if (isConnected === false) return "offline";
  if (isConnected === true) return "online";
  return "unknown";
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>("unknown");

  useEffect(() => {
    let alive = true;
    // Seed once with the current state, then subscribe to changes.
    NetInfo.fetch()
      .then((s) => alive && setStatus(toStatus(s.isConnected)))
      .catch(() => {});
    const unsub = NetInfo.addEventListener((s) => setStatus(toStatus(s.isConnected)));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return <Ctx.Provider value={status}>{children}</Ctx.Provider>;
}

/** Current device network status: "unknown" | "online" | "offline". */
export function useNetworkStatus(): NetworkStatus {
  return useContext(Ctx);
}
