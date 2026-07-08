import NodeMediaServer from "node-media-server";
import liveConfig from "./live_config.js";
import StreamManager from "./stream_manager.js";

export default function LiveServer() {

    const nms = new NodeMediaServer({
        rtmp: liveConfig.rtmp,
        http: liveConfig.http
    });

    StreamManager(nms);

    nms.run();

    console.log("=================================");
    console.log("🚀 Live Server Started");
    console.log(`📡 RTMP : rtmp://localhost:${liveConfig.rtmp.port}/live`);
    console.log(`🌍 HTTP : http://localhost:${liveConfig.http.port}`);
    console.log("=================================");

    return nms;
}