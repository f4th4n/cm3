import { startMarketDataStream } from "./src/streams/kline_stream";
import { startUserDataStream } from "./src/streams/user_data_stream";
import { fetchWallet } from "./src/risk_control/user_data_request";

const wallet = await fetchWallet();
if (wallet) {
  console.log("[Wallet] Loaded successfully");
}

startMarketDataStream();
startUserDataStream();
