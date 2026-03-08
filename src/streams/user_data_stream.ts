import { createHmac } from "crypto";

const isTestnet = Bun.env.BINANCE_TESTNET === "true";
const wsUrl = isTestnet
  ? "wss://ws-api.testnet.binance.vision/ws-api/v3"
  : "wss://ws-api.binance.com:443/ws-api/v3";

type AccountUpdate = {
  e: "outboundAccountPosition";
  E: number;
  B: { a: string; f: string; l: string }[];
};

type BalanceUpdate = {
  e: "balanceUpdate";
  E: number;
  a: string;
  d: string;
};

type OrderUpdate = {
  e: "executionReport";
  E: number;
  s: string;
  S: string;
  X: string;
  l: string;
  L: string;
};

type UserDataEvent = AccountUpdate | BalanceUpdate | OrderUpdate;

let reconnectDelay = 1000;

function signPayload(payload: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(payload).digest("hex");
}

export function startUserDataStream(): void {
  const apiKey = Bun.env.BINANCE_API_KEY;
  const secretKey = Bun.env.BINANCE_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.error("BINANCE_API_KEY and BINANCE_SECRET_KEY are required for user data stream");
    return;
  }

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    reconnectDelay = 1000;
    console.log("Connected to Binance WebSocket API");

    const timestamp = Date.now();
    const payload = `apiKey=${apiKey}&timestamp=${timestamp}`;
    const signature = signPayload(payload, secretKey);

    ws.send(JSON.stringify({
      id: crypto.randomUUID(),
      method: "userDataStream.subscribe.signature",
      params: { apiKey, timestamp, signature },
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string);

    // Skip subscribe response messages
    if ("status" in msg) return;

    const ev = msg.event as UserDataEvent;
    if (!ev?.e) return;

    if (ev.e === "outboundAccountPosition") {
      console.log("[User Data] [AccountUpdate]", { time: ev.E, balances: ev.B });
    } else if (ev.e === "balanceUpdate") {
      console.log("[User Data] [BalanceUpdate]", { time: ev.E, asset: ev.a, delta: ev.d });
    } else if (ev.e === "executionReport") {
      console.log("[User Data] [OrderUpdate]", {
        time: ev.E,
        symbol: ev.s,
        side: ev.S,
        status: ev.X,
        qty: ev.l,
        price: ev.L,
      });
    }
  };

  ws.onclose = () => {
    console.log(`User data stream closed. Reconnecting in ${reconnectDelay}ms...`);
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      startUserDataStream();
    }, reconnectDelay);
  };

  ws.onerror = (err) => {
    console.error("User data stream error:", err);
  };
}
