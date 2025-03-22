let client = AgoraRTC.createClient({
    mode:'rtc',
    'codec':'vp8'
})

let config = {
    appid: "Your Secret Agora Appid",
    token: null,
    uid: null,
    channel: 'videoCommunication'
}
let localTracks = {
    audioTrack: null,
    videoTrack: null,
}

let remoteTracks = {}

let localTrackState={
    audioTrackMuted:false,
    VideoTrackMuted:false,
}

document.getElementById('Join-btn').addEventListener('click', async()=>{
    console.log("User joined ")
    await joinStream();
    document.getElementById('Join-btn').style.display='none'
    document.getElementById('btn-footer').style.display='flex'

})


document.getElementById('leave-btn').addEventListener('click', async () => {
    for (trackName in localTracks) {
        let track = localTracks[trackName]
        if (track) {
            track.stop()  //stop camera and mic
            track.close()  //disconnect my mic and camera
            localTracks[trackName] = null
        }
    }
    await client.leave()   //leave the channel 
    document.getElementById('user-streams').innerHTML=''
    document.getElementById('btn-footer').style.display='none'
    document.getElementById('Join-btn').style.display='block'
    
 
})


document.getElementById('mic-btn').addEventListener('click', async()=>{
    if(!localTrackState.audioTrackMuted){
        await localTracks.audioTrack.setMuted(true)
        localTrackState.audioTrackMuted=true;
        document.getElementById('mic-btn').style.backgroundColor='rgb(255,80,80,0.7)'
    }
    else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted=false
        document.getElementById('mic-btn').style.backgroundColor='#1f1f1f8e'
    }
    
})


document.getElementById('camera-btn').addEventListener('click',async()=>{
    if(!localTrackState.VideoTrackMuted){
        await localTracks.videoTrack.setMuted(true)
        localTrackState.VideoTrackMuted=true;
        document.getElementById('camera-btn').style.backgroundColor='rgb(255,80,80,0.7)';
    }
    else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.VideoTrackMuted=false
        document.getElementById('camera-btn').style.backgroundColor='#1f1f1f8e';
    }
})


// this function uses promise.all() so when click the join button promise.all exeutes all the async function insise it ,and the valuse returned by the functions get stored in the variables
let joinStream = async () => {

    client.on("user-published", handleUserJoined)     //informed about another user joined
    client.on("user-left", handleUserLeft)

    let uid, audioTrack, videoTrack;
    [uid, audioTrack, videoTrack] = await Promise.all([
        client.join(config.appid, config.channel, config.token || null, config.uid || null),   //joins the agora channel and returns the uid
        AgoraRTC.createMicrophoneAudioTrack(), //retruns teh audioTrack
        AgoraRTC.createCameraVideoTrack(),   //return the videoTrack
    ])

    config.uid = uid;
    localTracks.audioTrack = audioTrack;
    localTracks.videoTrack = videoTrack;

    let videoPlayer = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid">${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                       </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
    localTracks.videoTrack.play(`stream-${config.uid}`)
    await client.publish([localTracks.audioTrack, localTracks.videoTrack])
}



let handleUserLeft = async (user) => {
    delete remoteTracks[user.uid]
    // document.getElementById(`video-wrapper-${user.uid}`).remove()
    // document.getElementById('forRemove').remove();
    let userElement = document.getElementById(`video-wrapper-${user.uid}`);
    if (userElement) userElement.remove();
}




let handleUserJoined = async (user, mediaType) => {
    console.log('User joined our stream')

    remoteTracks[user.uid] = user

    await client.subscribe(user, mediaType)

    let videoPlayer= document.getElementById(`video-wrapper-${user.uid}`)
    if(videoPlayer!=null){
        videoPlayer.remove()
    }

    if (mediaType === 'video') {
        let videoPlayer = `<div class="video-containers" id="video-wrapper-${user.uid}">
                                <p class="user-uid" id="forRemove" >${user.uid}</p>
                                <div class="video-player player" id="stream-${user.uid}"></div>
                           </div>`

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
        user.videoTrack.play(`stream-${user.uid}`)
    }

    if (mediaType === 'audio') {
        user.audioTrack.play()
    }
}
