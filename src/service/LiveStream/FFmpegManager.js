import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import liveConfig from "./liveConfig.js";

const processes = new Map();








//================================================================buildFFmpegArgs=================================================================
function buildFFmpegArgs(streamKey) {
  const input = `rtmp://127.0.0.1:${liveConfig.rtmp.port}/live/${streamKey}`;

  const outputDir = path.join(liveConfig.output.root, streamKey);

  fs.mkdirSync(outputDir, { recursive: true });

  return {
    input,
    outputDir,

    args: [
      "-y",

      "-i",
      input,

      "-filter_complex",
      "[0:v]split=3[v1080][v720][v480];" +
        "[v1080]scale=w=1920:h=1080[v1080out];" +
        "[v720]scale=w=1280:h=720[v720out];" +
        "[v480]scale=w=854:h=480[v480out]",

      // =====================
      // 1080p
      // =====================

      "-map",
      "[v1080out]",
      "-map",
      "0:a?",

      "-c:v:0",
      "libx264",
      "-b:v:0",
      "5000k",
      "-maxrate:v:0",
      "5350k",
      "-bufsize:v:0",
      "7500k",
      "-c:a:0",
      "aac",
      "-b:a:0",
      "192k",

      // =====================
      // 720p
      // =====================

      "-map",
      "[v720out]",
      "-map",
      "0:a?",
      "-c:v:1",
      "libx264",
      "-b:v:1",
      "2800k",
      "-maxrate:v:1",
      "3000k",
      "-bufsize:v:1",
      "4200k",
      "-c:a:1",
      "aac",
      "-b:a:1",
      "128k",

      // =====================
      // 480p
      // =====================

      "-map",
      "[v480out]",
      "-map",
      "0:a?",
      "-c:v:2",
      "libx264",
      "-b:v:2",
      "1200k",
      "-maxrate:v:2",
      "1500k",
      "-bufsize:v:2",
      "2100k",
      "-c:a:2",
      "aac",
      "-b:a:2",
      "96k",

      // =====================
      // HLS
      // =====================

      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_playlist_type",
      "event",
      "-hls_flags",
      "independent_segments",
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      "v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:480p",
      "-hls_segment_filename",
      path.join(outputDir, "%v", "segment_%03d.ts"),
      path.join(outputDir, "%v", "index.m3u8"),
    ],
  };
}


//================================================================start=================================================================
function start(streamKey) {
  if (processes.has(streamKey)) {
    return;
  }

  const { args } = buildFFmpegArgs(streamKey);

  console.log(args.join(" "));
  console.log("=================================");
  console.log("🎬 Starting FFmpeg");
  console.log("Stream:", streamKey);
  console.log("Executable:", liveConfig.ffmpeg.path);
  console.log("=================================");

  const ffmpeg = spawn(liveConfig.ffmpeg.path, args);

  ffmpeg.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  ffmpeg.stderr.on("data", (data) => {
    console.log(data.toString());
  });

  ffmpeg.on("close", () => {
    processes.delete(streamKey);
  });

  processes.set(streamKey, ffmpeg);
}

//==============================================================stop===================================================================
function stop(streamKey) {
  
  const ffmpeg = processes.get(streamKey);
  if (!ffmpeg) return;

  ffmpeg.kill("SIGINT");

  processes.delete(streamKey);
}

export default {
  buildFFmpegArgs,
  start,
  stop,
};
