
const canvas = document.querySelector("#whiteboard");
const ctx = canvas.getContext('2d');
const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const whiteboardButt = document.querySelector('.board-icon')

const whiteboardCont = document.querySelector('.whiteboard-cont');
let boardVisible = false;

whiteboardCont.style.visibility = 'hidden';

let isDrawing = 0;
let x = 0;
let y = 0;
let color = "black";
let drawSize = 3;
let colorRemote = "black";
let drawSizeRemote = 3;

function fitToContainer(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

fitToContainer(canvas);

//getCanvas call is under join room call
socket.on('getCanvas', url => {
    let img = new Image();
    img.onload = start;
    img.src = url;

    function start() {
        ctx.drawImage(img, 0, 0);
    }

    console.log('got canvas', url)
})

function setColor(newcolor) {
    color = newcolor;
    drawSize = 3;
}

function setEraser() {
    color = "white";
    drawSize = 10;
}

//might remove this
function reportWindowSize() {
    fitToContainer(canvas);
}

window.onresize = reportWindowSize;

//

function clearBoard() {
    if (window.confirm('Are you sure you want to clear board? This cannot be undone')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('store canvas', canvas.toDataURL());
        socket.emit('clearBoard');
    } else return;
}

socket.on('clearBoard', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
})

function draw(newx, newy, oldx, oldy) {
    ctx.strokeStyle = color;
    ctx.lineWidth = drawSize;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

    socket.emit('store canvas', canvas.toDataURL());

}

function drawRemote(newx, newy, oldx, oldy) {
    ctx.strokeStyle = colorRemote;
    ctx.lineWidth = drawSizeRemote;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

}


var pen = document.getElementById("pen");
pen.onclick = function () {
    canvas.addEventListener('mousedown', e => {
        x = e.offsetX;
        y = e.offsetY;
        isDrawing = 1;
    })

    canvas.addEventListener('mousemove', e => {
        if ((!drawrect) && isDrawing) {
            draw(e.offsetX, e.offsetY, x, y);
            socket.emit('draw', e.offsetX, e.offsetY, x, y, color, drawsize);
            x = e.offsetX;
            y = e.offsetY;
        }
    })

    window.addEventListener('mouseup', e => {
        if (isDrawing) {
            isDrawing = 0;
        }
    })

    socket.on('draw', (newX, newY, prevX, prevY, color, size) => {
        colorRemote = color;
        drawsizeRemote = size;
        drawRemote(newX, newY, prevX, prevY);
    })
    // canvas.onmousemove = null;
}

// 文本框
var txtbtn = document.getElementById('txtbtn');
txtbtn.onclick = function (e) {
    var x = 0;
    var y = 0;
    ctx.font = "20px Georgia";
    canvas.onmousedown = function (e) {
        x = e.pageX - this.offsetLeft;
        y = e.pageY - this.offsetTop;
        ctx.fillText(window.prompt("Please input text", ""), x, y);
    }
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseout = null;
}

// 矩形
var rect = document.getElementById('rect');
var drawrect = 0;
rect.onclick = function (e) {

    //矩形左上角的点
    ctx.beginPath();
    var startx = 0;
    var starty = 0;
    var endx = 0;
    var endy = 0;
    canvas.onmousedown = function (e) {
        drawrect = 1;
        startx = e.pageX - this.offsetLeft;
        starty = e.pageY - this.offsetTop;
    }
    canvas.onmouseup = function (e) {
        endx = e.pageX - this.offsetLeft;
        endy = e.pageY - this.offsetTop;
        ctx.strokeRect(startx, starty, endx - startx, endy - starty);
        ctx.closePath();
        drawrect = 0;
    }
    canvas.onmousemove = null;
    canvas.onmouseout = null;

}

save.onclick = function () {
    let url = canvas.toDataURL('image/jpg');
    let a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = 'scratch';
    a.target = '_blank';
    a.click();
};

whiteboardButt.addEventListener('click', () => {
    if (boardVisible) {
        whiteboardCont.style.visibility = 'hidden';
        boardVisible = false;
    } else {
        whiteboardCont.style.visibility = 'visible';
        boardVisible = true;
    }
})

record.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('getUserMedia supported.');
        navigator.mediaDevices.getUserMedia(
            // constraints - only audio needed for this app
            {
                audio: true
            })
            // Success callback
            .then(function (stream) {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                record.style.background = "red";
                let chunks = [];

                mediaRecorder.ondataavailable = function(e) {
                    chunks.push(e.data);
                }
                mediaRecorder.onstop = function(e) {
                    console.log("data available after MediaRecorder.stop() called.");

                    const audio = document.createElement('audio');
                    audio.setAttribute('controls', '');
                    var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
                    var audioURL = window.URL.createObjectURL(blob);
                    audio.src = audioURL;
                    console.log(audio);
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function() {
                        const base64data = reader.result;
                        socket.emit("audio", base64data)
                    }
                    chunks = []
                }
                stop.onclick = function () {
                    mediaRecorder.stop()
                    console.log(mediaRecorder.state);
                    console.log("recorder stopped");
                    record.style.background = "";
                }

            })
            // Error callback
            .catch(function (err) {
                    console.log('The following getUserMedia error occurred: ' + err);
                }
            );
    } else {
        console.log('getUserMedia not supported on your browser!');
    }
})




//whiteboard js end