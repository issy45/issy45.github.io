/* eslint-disable require-jsdoc */
$(function() {

  // SpeechRecognition
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
  var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

  let recognition = new SpeechRecognition()
  const grammar = '#JSGF V1.0; grammar phrase;'
  let speechRecognitionList = new SpeechGrammarList()

  speechRecognitionList.addFromString(grammar, 1)
  recognition.grammars = speechRecognitionList
  recognition.lang = 'ja-JP'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  const query = getUrlVars()
  const roomName = query['room']
  if (!roomName) {
    return
  }

  const peer = new Peer({
    key: '81539926-513a-4816-ae7c-9b110b376543',
    debug: 2,
  })

  peer.on('open', () => {
    $('#my-id').text(peer.id);
    let audioSource, videoSource
    navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
      for (let i = 0; i !== deviceInfos.length; ++i) {
        if (audioSource === undefined && deviceInfos[i].kind === 'audioinput') {
          audioSource = deviceInfos[i].deviceId;
        } else if (videoSource === undefined && deviceInfos[i].kind === 'videoinput') {
          videoSource = deviceInfos[i].deviceId;
        }
      }
    })

    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    }

    let room
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        $('#my-video').get(0).srcObject = stream
        room = peer.joinRoom('mesh_video_' + roomName, {mode: 'mesh', stream: stream, videoBandwidth: 100, audioBandwidth: 100})
      })
      .then(() => {
        room.on('data', message => {
          console.log(message.data)
          $('#text').append(message.data)
        })
        room.on('peerLeave', peerId => {
          $('.video_' + peerId).remove();
        });
        room.on('stream', stream => {
          const peerId = stream.peerId
          const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '')
          $('#their-videos').append($(
            '<div class="video_' + peerId +'" id="' + id + '">' +
              '<label>' + stream.peerId + ':' + stream.id + '</label>' +
              '<video class="remoteVideos" autoplay playsinline>' +
            '</div>'))
          const el = $('#' + id).find('video').get(0)
          el.srcObject = stream
          el.play()
        })

        recognition.start()

        recognition.onresult = function (event) {
          let res_ja = event.results[event.results.length - 1][0].transcript
          if (event.results[event.results.length - 1]['isFinal']) {
            $('.temp-text').text('')
            $('#text').append(res_ja + '。<br>')
            room.send(res_ja)
          } else {
            $('.temp-text').text(res_ja)
          }
        }

        recognition.onend = function(event) {
          recognition.start()
        }
      })
  })

  peer.on('error', err => {
    alert(err.message);
  })

  function getUrlVars() {
      let vars = []
      const hash  = window.location.search.slice(1).split('&');
      for (var i = 0; i < hash.length; i++) {
          const array = hash[i].split('=')
          vars[array[0]] = array[1]
      }

      return vars
  }
});
