const socket = io('/');

// const peer = new Peer(undefined, {
//   path: '/peerjs',
//   host: '/',
//   port: '3030'
// });

var peer=new Peer();

let myVideoStream;

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', (userId) => {
    connectToNewUser(userId, stream);
  });
  let text = $("input");
  $('html').keydown((e) => {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });

  socket.on("createMessage", message => {
    $('.messages').append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom()
  })
});

const fileInput = $('#file_input');
const sendFileButton = $('#send_file_button');

sendFileButton.click(() => {
  fileInput.click();
});

fileInput.change(event => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      socket.emit('file-message', {
        filename: file.name,
        data: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }
});

socket.on("fileMessage", file => {
  $('.messages').append(`<li class="message"><b>user</b><br/><a href="${file.data}" download="${file.filename}">${file.filename}</a></li>`);
  scrollToBottom();
});

peer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
};

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const taskInput = document.getElementById('task_input');
const addTaskButton = document.getElementById('add_task_button');
const taskList = document.querySelector('.tasks');

addTaskButton.addEventListener('click', () => {
  const taskText = taskInput.value;
  if (taskText.trim() !== "") {
    socket.emit('new-task', taskText);
    taskInput.value = "";
  }
});

socket.on('add-task', task => {
  const taskItem = document.createElement('li');
  taskItem.innerHTML = `
    <span>${task}</span>
    <button class="btn btn-success btn-sm complete-task">Complete</button>
    <button class="btn btn-danger btn-sm delete-task">Delete</button>
  `;
  taskList.appendChild(taskItem);
  addTaskListeners(taskItem);
});

const addTaskListeners = (taskItem) => {
  const completeButton = taskItem.querySelector('.complete-task');
  const deleteButton = taskItem.querySelector('.delete-task');

  completeButton.addEventListener('click', () => {
    taskItem.classList.toggle('completed');
    if (taskItem.classList.contains('completed')) {
      completeButton.textContent = "Undo";
    } else {
      completeButton.textContent = "Complete";
    }
  });

  deleteButton.addEventListener('click', () => {
    taskItem.remove();
    socket.emit('delete-task', taskItem.querySelector('span').textContent);
  });
};

socket.on('update-tasks', tasks => {
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const taskItem = document.createElement('li');
    taskItem.innerHTML = `
      <span>${task.text}</span>
      <button class="btn btn-success btn-sm complete-task">${task.completed ? "Undo" : "Complete"}</button>
      <button class="btn btn-danger btn-sm delete-task">Delete</button>
    `;
    if (task.completed) {
      taskItem.classList.add('completed');
    }
    taskList.appendChild(taskItem);
    addTaskListeners(taskItem);
  });
});
