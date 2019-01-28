$(document).ready(function () {
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
  var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

  var recognition = new SpeechRecognition()
  var grammar = '#JSGF V1.0; grammar phrase;'
  var speechRecognitionList = new SpeechGrammarList()

  var startBtn = document.querySelector('button.start')
  var stopBtn = document.querySelector('button.stop')

  var source = 'ja'
  var target = 'en'
  $('.source').change(function() {
    source = this.value
    if (source == 'ja') {
      recognition.lang = 'ja-JP'
    } else if (source == 'en') {
      recognition.lang = 'en-US'
    } else if (source == 'zh') {
      recognition.lang = 'zh-CN'
    }
  })
  $('.target').change(function() {
    target = this.value
  })

  speechRecognitionList.addFromString(grammar, 1)
  recognition.grammars = speechRecognitionList
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = function(event) {
    let res_ja = event.results[event.results.length - 1][0].transcript
    if (event.results[event.results.length - 1]['isFinal']) {
      let url = 'https://script.google.com/macros/s/AKfycbwBGFYiGV7m4AAT-V8mQB6_MvJ3dLcwL7y6vmmp1bpBxxqqYws/exec'
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

  recognition.onspeechend = function() {
    startBtn.disabled = false
  }

  recognition.onerror = function(event) {
    startBtn.disabled = false
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = false
    recognition.stop()
  })
  stopBtn.addEventListener('click', () => {
    startBtn.disabled = true
    recognition.start()
  })
})
