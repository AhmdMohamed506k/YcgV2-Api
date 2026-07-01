import FFmpegManager from "./FFmpegManager.js";

export default function StreamManager(nms) {
  console.log("📡 Stream Manager Initialized");

  nms.on("preConnect", (id, args) => {
    console.log("=================================");
    console.log("🟢 Client Connected");
    console.log("ID:", id);
    console.log("ARGS:", args);
    console.log("=================================");
  });

  nms.on("prePublish", (id, streamPath, args) => {
    console.log("=================================");
    console.log("🚀 Incoming Stream");
    console.log("ID:", id);
    console.log("PATH:", streamPath);
    console.log("ARGS:", args);
    console.log("=================================");
  });

  nms.on("postPublish", (id, streamPath, args) => {
    console.log("=================================");
    console.log("🎥 Stream Started");
    console.log("ID:", id);
    console.log("PATH:", streamPath);
    console.log("=================================");

    if (!streamPath) {
      console.log("❌ streamPath undefined");
      return;
    }

    const streamKey = streamPath.split("/").pop();

    console.log("🎬 Starting FFmpeg :", streamKey);

    FFmpegManager.start(streamKey);
  });

  nms.on("donePublish", (id, streamPath) => {
    if (!streamPath) return;

    const streamKey = streamPath.split("/").pop();

    console.log("🛑 Stream Ended:", streamKey);

    FFmpegManager.stop(streamKey);
  });
}
