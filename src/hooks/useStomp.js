import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";

export function useStomp(subs = []) {
  const ref = useRef(null);
  useEffect(() => {
    const httpBase = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:8080/api
    const root = httpBase.replace(/\/api.*$/,'');       // http://localhost:8080
    const wsURL = root.replace(/^http/i,'ws') + "/ws";  // ws://localhost:8080/ws

    const client = new Client({
      brokerURL: wsURL,
      reconnectDelay: 3000,
      debug: () => {}
    });

    client.onConnect = () => {
      subs.forEach(s => client.subscribe(s.destination, m => s.callback(JSON.parse(m.body))));
    };
    client.activate();
    ref.current = client;
    return () => client.deactivate();
  }, [JSON.stringify(subs)]);
  return ref.current;
}