$(document).ready(function () {
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
  var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

  let recognition = new SpeechRecognition()
  const grammar = '#JSGF V1.0; grammar phrase;'
  let speechRecognitionList = new SpeechGrammarList()

  const startBtn = document.querySelector('button.start')
  const stopBtn = document.querySelector('button.stop')

  let source = 'ja'
  let target = 'en'
  $('.source').change(function () {
    source = this.value
    if (source == 'ja') {
      recognition.lang = 'ja-JP'
    } else if (source == 'en') {
      recognition.lang = 'en-US'
    } else if (source == 'zh') {
      recognition.lang = 'zh-CN'
    }
  })
  $('.target').change(function () {
    target = this.value
  })

  speechRecognitionList.addFromString(grammar, 1)
  recognition.grammars = speechRecognitionList
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = function (event) {
    let res_ja = event.results[event.results.length - 1][0].transcript
    if (event.results[event.results.length - 1]['isFinal']) {
      const url = 'https://script.google.com/macros/s/AKfycbwBGFYiGV7m4AAT-V8mQB6_MvJ3dLcwL7y6vmmp1bpBxxqqYws/exec'
      $.get(url, {
        text: res_ja,
        source: source,
        target: target
      })
      .done(function(data) {
        let res_en = data
        $('.temp-text').text('')
        $('.res-ja').append(res_ja + '<br>')
        $('.res-en').append(res_en + '<br>')
      })
    } else {
      $('.temp-text').text(res_ja)
    }
  }

  recognition.onspeechend = function () {
    startBtn.disabled = false
    console.log('recognition.onspeechend');
  }

  recognition.onerror = function (event) {
    startBtn.disabled = false
    console.log('recognition.onerror');
  }

  recognition.onaudiostart = function(event) {
      //Fired when the user agent has started to capture audio.
      console.log('SpeechRecognition.onaudiostart');
  }
  
  recognition.onaudioend = function(event) {
      //Fired when the user agent has finished capturing audio.
      console.log('SpeechRecognition.onaudioend');
  }
  
  recognition.onend = function(event) {
      //Fired when the speech recognition service has disconnected.
      console.log('SpeechRecognition.onend');
    recognition.start()
  }

 
  recognition.onnomatch = function(event) {
      //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
      console.log('SpeechRecognition.onnomatch');
  }
  
  recognition.onsoundstart = function(event) {
      //Fired when any sound — recognisable speech or not — has been detected.
      console.log('SpeechRecognition.onsoundstart');
  }
  
  recognition.onsoundend = function(event) {
      //Fired when any sound — recognisable speech or not — has stopped being detected.
      console.log('SpeechRecognition.onsoundend');
  }
  
  recognition.onspeechstart = function (event) {
      //Fired when sound that is recognised by the speech recognition service as speech has been detected.
      console.log('SpeechRecognition.onspeechstart');
  }
  recognition.onstart = function(event) {
      //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
      console.log('SpeechRecognition.onstart');
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true
    recognition.start()
  })
  stopBtn.addEventListener('click', () => {
    startBtn.disabled = false
    recognition.stop()
  })
})
