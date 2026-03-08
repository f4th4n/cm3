const isTestnet = Bun.env.BINANCE_TESTNET === "true";
const baseUrl = isTestnet
  ? "https://testnet.binance.vision"
  : "https://api.binance.com";

export async function createListenKey(): Promise<string> {
  const apiKey = Bun.env.BINANCE_API_KEY;
  if (!apiKey) throw new Error("BINANCE_API_KEY is not set");

  const res = await fetch(`${baseUrl}/api/v3/userDataStream`, {
    method: "POST",
    headers: { "X-MBX-APIKEY": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to create listenKey: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { listenKey: string };
  return data.listenKey;
}

export async function keepAliveListenKey(listenKey: string): Promise<void> {
  const apiKey = Bun.env.BINANCE_API_KEY;
  if (!apiKey) throw new Error("BINANCE_API_KEY is not set");

  const res = await fetch(
    `${baseUrl}/api/v3/userDataStream?listenKey=${listenKey}`,
    {
      method: "PUT",
      headers: { "X-MBX-APIKEY": apiKey },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to keep alive listenKey: ${res.status} ${await res.text()}`);
  }
}
