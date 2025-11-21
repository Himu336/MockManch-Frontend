import VideoRoomClient from "./VideoRoomClient";

export default async function VideoRoomPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ channel: string }>, 
  searchParams: Promise<{ token?: string, appId?: string, uid?: string, roomId?: string }> 
}) {
  // Await the promises
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const channel = resolvedParams.channel;
  const token = resolvedSearchParams?.token || "";
  const appId = resolvedSearchParams?.appId || "";
  const uid = resolvedSearchParams?.uid || "";
  const roomId = resolvedSearchParams?.roomId || "";

  console.log("PAGE PARAMS (SERVER):", {
    channel, token, appId, uid, roomId
  });

  return (
    <VideoRoomClient
      channel={channel}
      token={token}
      appId={appId}
      uid={uid}
      roomId={roomId}
    />
  );
}