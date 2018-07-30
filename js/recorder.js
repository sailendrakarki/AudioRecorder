(function() {
  var $audioInLevel, $audioInSelect, $bufferSize, $cancel, $dateTime, $echoCancellation, $encoding, $encodingOption, $encodingProcess, $modalError, $modalLoading, $modalProgress, $record, $recording, $recordingList, $reportInterval, $testToneLevel, $timeDisplay, $timeLimit, BUFFER_SIZE, ENCODING_OPTION, MP3_BIT_RATE, OGG_KBPS, OGG_QUALITY, URL, audioContext, audioIn, audioInLevel, audioRecorder, defaultBufSz, disableControlsOnRecord, encodingProcess, iDefBufSz, minSecStr, mixer, onChangeAudioIn, onError, onGotAudioIn, onGotDevices, optionValue, plural, progressComplete, saveRecording, setProgress, startRecording, stopRecording, testTone, testToneLevel, updateBufferSizeText, updateDateTime;

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  URL = window.URL || window.webkitURL;

  audioContext = new AudioContext;

  if (audioContext.createScriptProcessor == null) {
    audioContext.createScriptProcessor = audioContext.createJavaScriptNode;
  }

 

  $audioInSelect = $('#audio-in-select');

  $audioInLevel = $('#audio-in-level');

  encoding = "wav";

  $recording = $('#recording');

  $timeDisplay = $('#time-display');

  $record = $('#record');

  $cancel = $('#cancel');

  $dateTime = $('#date-time');

  $recordingList = $('#recording-list');

  $modalLoading = $('#modal-loading');

  $modalProgress = $('#modal-progress');

  $modalError = $('#modal-error');

  $audioInLevel.attr('disabled', false);

  $audioInLevel[0].valueAsNumber = 80;

  testTone = (function() {
    var lfo, osc, oscMod, output;
    osc = audioContext.createOscillator();
    lfo = audioContext.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 2;
    oscMod = audioContext.createGain();
    osc.connect(oscMod);
    lfo.connect(oscMod.gain);
    output = audioContext.createGain();
    output.gain.value =1;
    oscMod.connect(output);
    osc.start();
    lfo.start();
    return output;
  })();

  
  audioInLevel = audioContext.createGain();

  audioInLevel.gain.value =($audioInLevel[0].valueAsNumber/100)*($audioInLevel[0].valueAsNumber/100);

  mixer = audioContext.createGain();

  audioIn = void 0;

  audioInLevel.connect(mixer);

  mixer.connect(audioContext.destination);

  audioRecorder = new WebAudioRecorder(mixer, {
    workerDir: 'js/',
    onEncoderLoading: function(recorder, encoding) {
      $modalLoading.find('.modal-title').html("Loading " + (encoding.toUpperCase()) + " encoder ...");
      $modalLoading.modal("show");
    
    }

  });

  audioRecorder.onEncoderLoaded = function() {
       $modalLoading.modal("hide");
  };

  
  $audioInLevel.on('input', function() {
    var level;
    level = $audioInLevel[0].valueAsNumber / 100;
    audioInLevel.gain.value = level * level;
    
  });

  onGotDevices = function(devInfos) {
    var index, info, name,nulloptions, options, _i, _len,k;
    nulloptions="<option value='no-input' selected>(No input)</option>";
  
    index = 0, k = 0;
    for (_i = 0, _len = devInfos.length; _i < _len; _i++) {
      info = devInfos[_i];
      if (info.kind !== 'audioinput') {
        continue;
      }
     
      name = info.label || ("Audio in " + (++index));
      options += "<option value=" + info.deviceId + ">" + name + "+</option>";
      k++;
    }
   
    if(k>0){
      options=options   
      $audioInLevel.removeClass('hidden');
    }else {
      options=nulloptions;
      $record.addClass('hidden');
      $timeDisplay.addClass('hidden');
    }
  
    $audioInSelect.html(options);
    onChangeAudioIn();
  };

  onError = function(msg) {
    $modalError.find('.alert').html(msg);
    $modalError.modal('show');
  };

  if ((navigator.mediaDevices != null) && (navigator.mediaDevices.enumerateDevices != null)) {
    navigator.mediaDevices.enumerateDevices().then(onGotDevices)["catch"](function(err) {
      return onError("Could not enumerate audio devices: " + err);
    });
  } else {

    $audioInSelect.html('<option value="no-input" selected>(No input)</option><option value="default-audio-input">Default audio input</option>');
  }

  onGotAudioIn = function(stream) {
    if (audioIn != null) {
      audioIn.disconnect();
    }
    audioIn = audioContext.createMediaStreamSource(stream);
     return audioIn.connect(audioInLevel);

  };

  onChangeAudioIn = function() {
    var constraint, deviceId;
    deviceId = $audioInSelect[0].value;
    if (deviceId === 'no-input') {
      if (audioIn != null) {
        audioIn.disconnect();
      }
      audioIn = void 0;
      $audioInLevel.addClass('hidden');
    } else {
      if (deviceId === 'default-audio-input') {
        deviceId = void 0;
      }
      if (navigator.webkitGetUserMedia !== undefined) {
        constraint = {
          video: false,
          audio: {
            optional: [
                {sourceId:deviceId},
                {googAutoGainControl: false},
                {googAutoGainControl2: false},
                {echoCancellation: false},
                {googEchoCancellation: false},
                {googEchoCancellation2: false},
                {googDAEchoCancellation: false},
                {googNoiseSuppression: false},
                {googNoiseSuppression2: false},
                {googHighpassFilter: false},
                {googTypingNoiseDetection: false},
                {googAudioMirroring: false}
              ]
            }
          }
        }
      else if (navigator.mozGetUserMedia !== undefined) {
        constraint = {
          video: false,
          audio: {
            deviceId: deviceId ? { exact: deviceId } : void 0,
            echoCancellation: false,
            mozAutoGainControl: false
            }
          }

       }
      else {
        constraint = {
          video: false,
          audio: {
            deviceId: deviceId ? {exact: deviceId} : void 0,
            echoCancellation: false
          }
        }
      }
      if ((navigator.mediaDevices != null) && (navigator.mediaDevices.getUserMedia != null)) {
        navigator.mediaDevices.getUserMedia(constraint).then(onGotAudioIn)["catch"](function(err) {
          return onError("Could not get audio media device: " + err);
        });
      } else {
        navigator.getUserMedia(constraint, onGotAudioIn, function() {
          return onError("Could not get audio media device: " + err);
        });
      }
    }
  };

  $audioInSelect.on('change', onChangeAudioIn);


  plural = function(n) {
    if (n > 1) {
      return 's';
    } else {
      return '';
    }
  };

  OGG_QUALITY = [-0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  OGG_KBPS = [45, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 500];

  MP3_BIT_RATE = [64, 80, 96, 112, 128, 160, 192, 224, 256, 320];

  ENCODING_OPTION = {
    wav: {
      label: '',
      hidden: true,
      max: 1,
      text: function(val) {
        return '';
      }
    },
    ogg: {
      label: 'Quality',
      hidden: false,
      max: OGG_QUALITY.length - 1,
      text: function(val) {
        return "" + (OGG_QUALITY[val].toFixed(1)) + " (~" + OGG_KBPS[val] + "kbps)";
      }
    },
    mp3: {
      label: 'Bit rate',
      hidden: false,
      max: MP3_BIT_RATE.length - 1,
      text: function(val) {
        return "" + MP3_BIT_RATE[val] + "kbps";
      }
    }
  };

  optionValue = {
    wav: null,
    ogg: 6,
    mp3: 5
  };

  
  encodingProcess = 'background';

  defaultBufSz = (function() {
    var processor;
    processor = audioContext.createScriptProcessor(void 0, 2, 2);
    return processor.bufferSize;
  })();

  BUFFER_SIZE = [256, 512, 1024, 2048, 4096, 8192, 16384];

  iDefBufSz = BUFFER_SIZE.indexOf(defaultBufSz);

  updateBufferSizeText = function() {
    var iBufSz, text;
    iBufSz = 2048;
    text = "" + BUFFER_SIZE[iBufSz];
   
  };

 
  updateBufferSizeText();

  saveRecording = function(blob, enc) {
    var html, time, url;
    time = new Date();
    url = URL.createObjectURL(blob);
  
    html = ("<p recording='" + url + "'>") + ("<audio controls src='" + url + "'></audio> ") + ("<a class='btn btn-default' href='" + url + "' download='recording." + enc + "'>") + "Save..." + "</a> " + ("<button class='btn btn-danger' recording='" + url + "'>Delete</button>");
    "</p>";
    
    $recordingList.prepend($(html));
  };

  $recordingList.on('click', 'button', function(event) {
    var url;
    url = $(event.target).attr('recording');
    $("p[recording='" + url + "']").remove();
    URL.revokeObjectURL(url);
  });

  minSecStr = function(n) {
    return (n < 10 ? "0" : "") + n;
  };

  updateDateTime = function() {
    var sec;
    $dateTime.html((new Date).toString());
    sec = audioRecorder.recordingTime() | 0;
    $timeDisplay.html("" + (minSecStr(sec / 60 | 0)) + ":" + (minSecStr(sec % 60)));
  };

  window.setInterval(updateDateTime, 200);

  progressComplete = false;

  setProgress = function(progress) {
    var percent;
    percent = "" + ((progress * 100).toFixed(1)) + "%";
    $modalProgress.find('.progress-bar').attr('style', "width: " + percent + ";");
    $modalProgress.find('.text-center').html(percent);
    progressComplete = progress === 1;
  };

  $modalProgress.on('hide.bs.modal', function() {
    if (!progressComplete) {
      audioRecorder.cancelEncoding();
    }
  });

  disableControlsOnRecord = function(disabled) {
    $audioInSelect.attr('disabled', disabled);
  
  };

  startRecording = function() {
    $timeDisplay.css('color','red');
    $record.attr('src',"img/stopbtn.png");
    $cancel.removeClass('hidden');
    disableControlsOnRecord(true);
    audioRecorder.setOptions({
      timeLimit: 60 * 60,
      encodeAfterRecord: encodingProcess === 'separate',
      progressInterval: 1* 1000,
      ogg: {
        quality: OGG_QUALITY[optionValue.ogg]
      },
      mp3: {
        bitRate: MP3_BIT_RATE[optionValue.mp3]
      }
    });
    audioRecorder.startRecording();
    setProgress(0);
  };

  stopRecording = function(finish) {
    $timeDisplay.css('color','');
    $record.attr('src',"img/recordicon.png");
    $cancel.addClass('hidden');
    disableControlsOnRecord(false);
    if (finish) {
      audioRecorder.finishRecording();
      if (audioRecorder.options.encodeAfterRecord) {
        $modalProgress.find('.modal-title').html("Encoding " + (audioRecorder.encoding.toUpperCase()));
        $modalProgress.modal('show');
      }
    } else {
      audioRecorder.cancelRecording();
    }
  };

  $record.on('click', function() {
    if (audioRecorder.isRecording()) {
      stopRecording(true);
    } else {
      startRecording();
    }
  });

  $cancel.on('click', function() {
    stopRecording(false);
  });

  audioRecorder.onTimeout = function(recorder) {
    stopRecording(true);
  };

  audioRecorder.onEncodingProgress = function(recorder, progress) {
    setProgress(progress);
  };

  audioRecorder.onComplete = function(recorder, blob) {
    if (recorder.options.encodeAfterRecord) {
      $modalProgress.modal('hide');
    }
    saveRecording(blob, recorder.encoding);
  };

  audioRecorder.onError = function(recorder, message) {
    onError(message);
  };

}).call(this);
