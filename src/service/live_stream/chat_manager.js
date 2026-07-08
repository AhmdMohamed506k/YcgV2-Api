import MyPusher from "../Pusher/PusherConfig";


export const sendSystemNotification = async (streamKey, text) => {
    await MyPusher.trigger(`stream-${streamKey}`, "system-notification", {
        message: text,
        sender: "System",
        timestamp: new Date()
    });
};