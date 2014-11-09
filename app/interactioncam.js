(function() {

  var API_KEY = 'eb18642b5b220484864483b8e21386c3';
      //  ^ get your own at https://imgur.com/register/api_anon
      //    as it is limited to 50 uploads an hour!
  var video        = document.querySelector('#video'),
      cover        = document.querySelector('#cover'),
      canvas       = document.querySelector('#canvas'),
      vidcontainer = document.querySelector('#videocontainer'),
      resetbutton  = document.querySelector('#resetbutton'),
      startbutton  = document.querySelector('#startbutton'),
      uploadbutton = document.querySelector('#uploadbutton'),
      urlfield     = document.querySelector('#uploaded input'),
      urllink      = document.querySelector('#uploaded a');

 var ctx    = canvas.getContext('2d'),
     streaming    = false,
     width  = 600,
     height = 450,
     state  = 'intro';

 var audio = document.querySelectorAll('audio'),
     sounds = {
        shutter: audio[0],
        rip:     audio[1],
        takeoff: audio[2]
      };

  /* BRANDING */
  var img = new Image(),
      imgwidth = 150,
      imgheight = 150;
  img.src = 'mozcamp.png';

  if (location.hostname.indexOf('localhost')!== -1) {
    document.querySelector('#imgurform').style.display = 'none';
  }

  setstate(state);

  function init() {
    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
        video: true,
        audio: false
      },
      function(stream) {
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
        }
        video.play();
        video.style.width = width + 'px';
        video.style.height = height + 'px';
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );
  }

  function takepicture() {
    sounds.shutter.play();
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, finalheight);
    ctx.restore();
    ctx.scale(1, 1);
    ctx.drawImage(img, 590 - imgwidth, 440 - imgheight, imgwidth, imgheight);
  }

  function reshoot() {
    if (state === 'reviewing' || state === 'uploaded') {
      canvas.width = width;
      canvas.height = finalheight;
      ctx.drawImage(img, 590 - imgwidth, 440 - imgheight, imgwidth, imgheight);
      setstate('playing');
    }
  }

  function initiateupload() {
    if (state === 'reviewing') {
      sounds.takeoff.play();
      setstate('uploading');
      upload();
    }
  }

  function upload() {
    var head = /^data:image\/(png|jpeg);base64,/,
        data = '',
        fd = new FormData(),
        xhr = new XMLHttpRequest();

    setstate('uploading');

    $.ajax('http://localhost:5000/api/similarity', {
      type: 'POST',
      data: canvas.toDataURL('image/jpeg', 0.9).replace(/^data:image\/(png|jpeg);base64,/, ""),
      headers: {'Content-Type' : 'application/octet-stream'},
      success: function (matches)
      {
        // alert(matches["images"][0])
        var image = document.createElement("img");
        image.src = matches["images"][0];

        ctx.drawImage(image, 590 - imgwidth, 440 - imgheight, imgwidth, imgheight);

        canvas.style.display='none';
        vidcontainer.style.display='none'

        var src = document.getElementById("header");
        src.appendChild(image);
      }
    });

  }

 function setstate(newstate) {
    state = newstate;
    document.body.className = newstate;
  }
  function store(name) {
    if (localStorage.interactionphotos === undefined) {
      localStorage.interactionphotos = '';
    }
    localStorage.interactionphotos += ' '+ name;
  }

  /* Event Handlers */

  video.addEventListener('play', function(ev){
    if (!streaming) {
      console.log(video.clientHeight);
      finalheight = video.clientHeight / (video.clientWidth/width);
      video.setAttribute('width', width);
      video.setAttribute('height', finalheight);
      canvas.width = width;
      canvas.height = finalheight;
      ctx.drawImage(img, 590 - imgwidth, 440 - imgheight, imgwidth, imgheight);
      streaming = true;
      vidcontainer.classname = 'playing';
    }
  }, false);

  document.addEventListener('keydown', function(ev) {
    if (ev.which === 32 || ev.which === 37 || ev.which === 39) {
      ev.preventDefault();
    }
    if (ev.which === 32) {
      if (state === 'intro') {
        setstate('playing');
        init();
      } else {
        setstate('reviewing');
        takepicture();
      }
    }
    if (ev.which === 37) {
      reshoot();
    }
    if (ev.which === 39) {
      initiateupload();
    }
  },false);

  video.addEventListener('click', function(ev){
    setstate('reviewing');
    takepicture();
  }, false);

  resetbutton.addEventListener('click', function(ev){
    if (state === 'reviewing') {
      setstate('playing');
    }
    ev.preventDefault();
  }, false);

  startbutton.addEventListener('click', function(ev){
    if (state === 'uploaded') {
      setstate('playing');
    }
    ev.preventDefault();
  }, false);

  uploadbutton.addEventListener('click', function(ev){
    if (state === 'reviewing') {
      setstate('uploading');
      upload();
    }
    ev.preventDefault();
  }, false);

})();