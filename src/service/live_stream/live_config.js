import path from "path";

const ROOT = process.cwd();

export const liveConfig = {

 
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        mediaroot: "F:\\media",
        allow_origin: "*"
    },
    ffmpeg: {
        path: "C:\\ffmpeg\\bin\\ffmpeg.exe"
    },
    output: {
        root: "F:\\media\\hls"
    },
    qualities: [

        {
            name: "1080p",
            width: 1920,
            height: 1080,
            videoBitrate: "5000k",
            maxRate: "5350k",
            bufferSize: "7500k",
            audioBitrate: "192k"
        },

        {
            name: "720p",
            width: 1280,
            height: 720,
            videoBitrate: "2800k",
            maxRate: "3000k",
            bufferSize: "4200k",
            audioBitrate: "128k"
        },

        {
            name: "480p",
            width: 854,
            height: 480,
            videoBitrate: "1200k",
            maxRate: "1500k",
            bufferSize: "2100k",
            audioBitrate: "96k"
        }

    ]

};

export default liveConfig;