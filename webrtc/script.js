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
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let localStream

  const peer = new Peer({
    key: '81539926-513a-4816-ae7c-9b110b376543',
    debug: 3,
  })

  peer.on('open', () => {
    step1()
  })

  peer.on('error', err => {
    alert(err.message);
    step2()
  })

  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];
  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  const roomName = 'hoge'
  if (!roomName) {
    return
  }
  let room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: localStream});
  room.on('open', function() {
    connect(room);
  });
  step3(room);

  recognition.onresult = function (event) {
    let res_ja = event.results[event.results.length - 1][0].transcript
    if (event.results[event.results.length - 1]['isFinal']) {
      $('.temp-text').text('')
      $('.res-ja').append(res_ja + '。<br>')
      room.send(res_ja);
    } else {
      $('.temp-text').text(res_ja)
    }
  }

  recognition.onend = function(event) {
    recognition.start()
  }


  function step1() {
    // Get audio/video stream
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      localStream = stream;

      if (room) {
        room.replaceStream(stream);
        return;
      }

      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    $('#their-videos').empty();
    recognition.stop()
  }

  function step3(room) {
    // Wait for stream on the call, then set peer video display
    room.on('stream', stream => {
      const peerId = stream.peerId;
      const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

      $('#their-videos').append($(
        '<div class="video_' + peerId +'" id="' + id + '">' +
          '<label>' + stream.peerId + ':' + stream.id + '</label>' +
          '<video class="remoteVideos" autoplay playsinline>' +
        '</div>'));
      const el = $('#' + id).find('video').get(0);
      el.srcObject = stream;
      el.play();
    });

    room.on('removeStream', stream => {
      const peerId = stream.peerId;
      $('#video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '')).remove();
    });

    // UI stuff
    room.on('close', step2);
    room.on('peerLeave', peerId => {
      $('.video_' + peerId).remove();
    });
    $('#step1, #step2').hide();
    $('#step3').show();

    recognition.start()
  }

  function connect(room) {
    // Handle a chat connection.
    room.once('log', logs => {
      for (let i = 0; i < logs.length; i++) {
        const log = JSON.parse(logs[i]);

        switch (log.messageType) {
          case 'ROOM_DATA':
            $('.res-ja').append('<div><span class="peer">' + log.message.src + '</span>: ' + log.message.data + '</div>');
            break;
          case 'ROOM_USER_JOIN':
            if (log.message.src === peer.id) {
              break;
            }
            $('.res-ja').append('<div><span class="peer">' + log.message.src + '</span>: has joined the room </div>');
            break;
          case 'ROOM_USER_LEAVE':
            if (log.message.src === peer.id) {
              break;
            }
            $('.res-ja').append('<div><span class="peer">' + log.message.src + '</span>: has left the room </div>');
            break;
        }
      }
    });

    room.on('data', message => {
      if (message.data instanceof ArrayBuffer) {
        const dataView = new Uint8Array(message.data);
        const dataBlob = new Blob([dataView]);
        const url = URL.createObjectURL(dataBlob);
        $('.res-ja').append('<div><span class="file">' +
          message.src + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
      } else {
        $('.res-ja').append('<div><span class="peer">' + message.src + '</span>: ' + message.data + '</div>');
      }
    });
  }
});
