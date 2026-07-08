import Pusher from "pusher";



if (!process.env.PusherSecret) {
    console.error("❌ Pusher Secret is missing! Check your .env file and naming.");
}


const MyPusher = new Pusher({
  appId: process.env.PusherApp_id,
  key: process.env.Pusherkey,
  secret: process.env.PusherSecret,
  cluster: process.env.Pushercluster,
  useTLS: true
});

export default MyPusher;
