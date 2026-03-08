import { createListenKey, keepAliveListenKey } from "../risk_control/user_data_api";

const isTestnet = Bun.env.BINANCE_TESTNET === "true";
const wsBase = isTestnet
  ? "wss://testnet.binance.vision"
  : "wss://stream.binance.com:9443";

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

export async function startUserDataStream(): Promise<void> {
  let listenKey: string;
  try {
    listenKey = await createListenKey();
  } catch (err) {
    console.error("Failed to create listenKey:", err);
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      startUserDataStream();
    }, reconnectDelay);
    return;
  }

  const ws = new WebSocket(`${wsBase}/ws/${listenKey}`);

  const keepAliveTimer = setInterval(async () => {
    try {
      await keepAliveListenKey(listenKey);
    } catch (err) {
      console.error("Failed to keep alive listenKey:", err);
    }
  }, 29 * 60 * 1000);

  ws.onopen = () => {
    reconnectDelay = 1000;
    console.log("Connected to Binance user data stream");
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as UserDataEvent;

    if (msg.e === "outboundAccountPosition") {
      console.log("[AccountUpdate]", { time: msg.E, balances: msg.B });
    } else if (msg.e === "balanceUpdate") {
      console.log("[BalanceUpdate]", { time: msg.E, asset: msg.a, delta: msg.d });
    } else if (msg.e === "executionReport") {
      console.log("[OrderUpdate]", {
        time: msg.E,
        symbol: msg.s,
        side: msg.S,
        status: msg.X,
        qty: msg.l,
        price: msg.L,
      });
    }
  };

  ws.onclose = () => {
    clearInterval(keepAliveTimer);
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
