import { startMarketDataStream } from "./src/streams/kline_stream";
import { startUserDataStream } from "./src/streams/user_data_stream";

startMarketDataStream();
startUserDataStream();
