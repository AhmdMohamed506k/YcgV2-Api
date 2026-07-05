import FFmpegManager from "./FFmpegManager.js";
import companyModel from "../../../DB/models/Company/Company.model.js";
import { streamModel } from "../../../DB/models/LiveStream/LiveStream.model.js";

export default function StreamManager(nms) {
  console.log("📡 Stream Manager Initialized");

  // ======================PreConnectAction========================================
  nms.on("preConnect", (id, args) => {
    console.log("=================================");
    console.log("🟢 Client Connected");
    console.log("ID:", id);
    console.log("ARGS:", args);
    console.log("=================================");
  });

  // ========================PrePublishAction======================================
  nms.on("prePublish", async (id, streamPath, args) => {
    const streamKey = streamPath.split("/").pop();

    try {
      const CompanyExist = await companyModel.findOne({ streamKey: streamKey });

      if (!CompanyExist || CompanyExist.IsPremiumCompany !== true) {
        console.log("Sorry this Feature is only for premium companies");
        let session = nms.getSession(id);
        if (session) session.reject();
        return;
      }

     
      await streamModel.findOneAndUpdate({ streamKey },{
          isActive: true,
          status: "online",
          companyId: CompanyExist._id, 
        },
        { upsert: true, new: true }, 
      );

      await streamModel.updateOne({ streamKey },{ isActive: true, status: "online" },

      );
    } catch (err) {
      console.error("❌ Error occurred while cheeking subscription  ", err);
      nms.reject(id);
    }

    console.log("=================================");
    console.log("🚀 Incoming Stream");
    console.log("ID:", id);
    console.log("PATH:", streamPath);
    console.log("ARGS:", args);
    console.log("=================================");
  });

  // ========================PostPublishAction====================================
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

  // ========================DonePublishAction=====================================
  nms.on("donePublish", async (id, streamPath) => {
    if (!streamPath) return;

    const streamKey = streamPath.split("/").pop();

    console.log("🛑 Stream Ended:", streamKey);

    await streamModel.updateOne(
      { streamKey },
      { isActive: false, status: "offline" },
    );
    FFmpegManager.stop(streamKey);
  });
}
