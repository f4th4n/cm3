import { createHmac } from "crypto";
import { type Wallet, setWallet } from "./wallet";

const isTestnet = Bun.env.BINANCE_TESTNET === "true";
const baseUrl = isTestnet
  ? "https://testnet.binance.vision"
  : "https://api.binance.com";

function sign(query: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(query).digest("hex");
}

export async function fetchWallet(): Promise<Wallet | null> {
  const apiKey = Bun.env.BINANCE_API_KEY;
  const secretKey = Bun.env.BINANCE_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.error("BINANCE_API_KEY and BINANCE_SECRET_KEY are required to fetch wallet");
    return null;
  }

  const params = `omitZeroBalances=true&timestamp=${Date.now()}`;
  const signature = sign(params, secretKey);
  const url = `${baseUrl}/api/v3/account?${params}&signature=${signature}`;

  const res = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });
  if (!res.ok) {
    console.error(`Failed to fetch wallet: ${res.status} ${await res.text()}`);
    return null;
  }

  const data = await res.json() as Wallet;
  setWallet(data);
  return data;
}
