const rotations = [
  { label: "Tandoor Subah", start: 5, end: 9 },
  { label: "Chai Counter", start: 9, end: 17 },
  { label: "Shaam Ki Thali", start: 17, end: 22 },
  { label: "Highway Raat", start: 22, end: 5 },
];

let youtubePlayer;
let progressTimer;
let isSeeking = false;

function getIndiaHour() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === "hour").value);
}

function isActive(hour, start, end) {
  if (start < end) {
    return hour >= start && hour < end;
  }

  return hour >= start || hour < end;
}

function updateRotation() {
  const indiaHour = getIndiaHour();
  const active = rotations.find((rotation) => isActive(indiaHour, rotation.start, rotation.end));
  const nowLabel = document.querySelector("#now-label");

  document.querySelectorAll(".rotation-card").forEach((card) => {
    const start = Number(card.dataset.start);
    const end = Number(card.dataset.end);
    const cardIsActive = isActive(indiaHour, start, end);

    card.classList.toggle("is-active", cardIsActive);
    card.setAttribute("aria-current", cardIsActive ? "true" : "false");
  });

  if (nowLabel && active) {
    nowLabel.textContent = `Now in India: ${active.label}`;
  }
}

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function updateTrackInfo() {
  if (!youtubePlayer || !youtubePlayer.getVideoData) {
    return;
  }

  const data = youtubePlayer.getVideoData();
  const title = data?.title || "Dhaba Wala Playlist";
  const videoId = data?.video_id || "5MIGQBpVeqs";
  const titleNode = document.querySelector("#track-title");
  const sourceNode = document.querySelector("#track-source");
  const photoNode = document.querySelector("#song-photo");

  titleNode.textContent = title;
  sourceNode.textContent = "YouTube Playlist";
  photoNode.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function updateProgress() {
  if (!youtubePlayer || !youtubePlayer.getDuration || isSeeking) {
    return;
  }

  const duration = youtubePlayer.getDuration();
  const current = youtubePlayer.getCurrentTime();
  const progress = document.querySelector("#track-progress");
  const currentTime = document.querySelector("#current-time");
  const durationTime = document.querySelector("#duration-time");

  if (!duration) {
    return;
  }

  progress.value = (current / duration) * 100;
  currentTime.textContent = formatTime(current);
  durationTime.textContent = formatTime(duration);
}

function setPlayingState(isPlaying) {
  const playButton = document.querySelector("#play-track");

  playButton.textContent = isPlaying ? "PAUSE" : "PLAY";
  playButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
}

function setupControls() {
  const playButton = document.querySelector("#play-track");
  const previousButton = document.querySelector("#prev-track");
  const nextButton = document.querySelector("#next-track");
  const progress = document.querySelector("#track-progress");

  playButton.addEventListener("click", () => {
    if (!youtubePlayer) {
      return;
    }

    const state = youtubePlayer.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
      youtubePlayer.pauseVideo();
      return;
    }

    youtubePlayer.playVideo();
  });

  previousButton.addEventListener("click", () => {
    youtubePlayer?.previousVideo();
  });

  nextButton.addEventListener("click", () => {
    youtubePlayer?.nextVideo();
  });

  progress.addEventListener("input", () => {
    isSeeking = true;
  });

  progress.addEventListener("change", () => {
    if (!youtubePlayer || !youtubePlayer.getDuration) {
      return;
    }

    const duration = youtubePlayer.getDuration();
    youtubePlayer.seekTo((Number(progress.value) / 100) * duration, true);
    isSeeking = false;
  });
}

function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player("youtube-player", {
    events: {
      onReady: () => {
        setupControls();
        updateTrackInfo();
        updateProgress();
        progressTimer = setInterval(() => {
          updateTrackInfo();
          updateProgress();
        }, 1000);
      },
      onStateChange: (event) => {
        setPlayingState(event.data === YT.PlayerState.PLAYING);
        updateTrackInfo();
      },
    },
  });
}

updateRotation();
setInterval(updateRotation, 60 * 1000);

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
