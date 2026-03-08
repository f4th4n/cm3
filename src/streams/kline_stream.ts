import { config } from "../../config";

type OHLCV = {
  symbol: string;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  isClosed: boolean;
};

let reconnectDelay = 1000;

export function startMarketDataStream(): void {
  const streams = config.symbols
    .map((s) => `${s.toLowerCase()}@kline_1m`)
    .join("/");
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string);
    const k = msg.data?.k;
    if (!k) return;

    const ohlcv: OHLCV = {
      symbol: k.s,
      openTime: k.t,
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c,
      volume: k.v,
      isClosed: k.x,
    };

    console.log(ohlcv);
  };

  ws.onclose = () => {
    console.log(`WebSocket closed. Reconnecting in ${reconnectDelay}ms...`);
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      startMarketDataStream();
    }, reconnectDelay);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  ws.onopen = () => {
    reconnectDelay = 1000;
    console.log("Connected to Binance WebSocket stream");
  };
}
