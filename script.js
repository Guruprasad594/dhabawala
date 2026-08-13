const playlistId = "PLgObA3pAqvOh87Z03QG8Z4xE-uqlAWSBy";
const firstVideoId = "5MIGQBpVeqs";
const moods = [
  { label: "Tandoor Subah", start: 5, end: 9 },
  { label: "Chai Counter", start: 9, end: 17 },
  { label: "Shaam Ki Thali", start: 17, end: 22 },
  { label: "Highway Raat", start: 22, end: 5 },
];

let youtubePlayer;
let isSeeking = false;
let controlsReady = false;
let wasMuted = false;

function renderIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function setupMouseParallax() {
  const root = document.querySelector(".station-screen");
  const targets = [...document.querySelectorAll("[data-depth]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!root || !targets.length || reduceMotion.matches) {
    return;
  }

  let pointerX = 0;
  let pointerY = 0;
  let frameRequested = false;

  const paint = () => {
    frameRequested = false;
    root.style.setProperty("--mouse-glow-x", `${pointerX * 80}px`);
    root.style.setProperty("--mouse-glow-y", `${pointerY * 60}px`);

    targets.forEach((target) => {
      const depth = Number(target.dataset.depth || 0);
      target.style.transform = `translate3d(${pointerX * depth}px, ${pointerY * depth}px, 0)`;
    });
  };

  const queuePaint = () => {
    if (!frameRequested) {
      frameRequested = true;
      window.requestAnimationFrame(paint);
    }
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    queuePaint();
  });

  window.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
    queuePaint();
  });
}

function getIndiaParts() {
  const date = new Date();
  const timeParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const hour24 = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );

  return {
    hour24,
    dateLabel,
    time: `${timeParts.find((part) => part.type === "hour").value}:${timeParts.find((part) => part.type === "minute").value} ${timeParts.find((part) => part.type === "dayPeriod").value.toLowerCase()}`,
  };
}

function isActiveHour(hour, start, end) {
  if (start < end) {
    return hour >= start && hour < end;
  }

  return hour >= start || hour < end;
}

function updateClockAndMood() {
  const { hour24, dateLabel, time } = getIndiaParts();
  const mood = moods.find((item) => isActiveHour(hour24, item.start, item.end));
  const timeNode = document.querySelector("#station-time");
  const dateNode = document.querySelector("#station-date");
  const moodNode = document.querySelector("#now-label");

  timeNode.textContent = time;
  dateNode.textContent = `${dateLabel} - IST`;
  timeNode.setAttribute("datetime", new Date().toISOString());

  if (mood) {
    moodNode.textContent = `NOW PLAYING - ${mood.label}`;
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

function setPlayingState(isPlaying) {
  const playButton = document.querySelector("#play-track");

  playButton.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
}

function setMutedState(isMuted) {
  const muteButton = document.querySelector("#mute-track");

  muteButton.classList.toggle("is-muted", isMuted);
  muteButton.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
}

function updateTrackInfo() {
  if (!youtubePlayer?.getVideoData) {
    return;
  }

  const data = youtubePlayer.getVideoData();
  const videoId = data?.video_id || firstVideoId;
  const title = data?.title || "Dhaba Wala Playlist";
  const author = data?.author || "YouTube Playlist";

  document.querySelector("#track-title").textContent = title;
  document.querySelector("#track-source").textContent = `${author} - YouTube playlist`;
  document.querySelector("#song-photo").src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function updateProgress() {
  if (!youtubePlayer?.getDuration || isSeeking) {
    return;
  }

  const duration = youtubePlayer.getDuration();
  const current = youtubePlayer.getCurrentTime();

  if (!duration) {
    return;
  }

  document.querySelector("#track-progress").value = (current / duration) * 100;
  document.querySelector("#current-time").textContent = formatTime(current);
  document.querySelector("#duration-time").textContent = formatTime(duration);
}

function bindControls() {
  if (controlsReady) {
    return;
  }

  const playButton = document.querySelector("#play-track");
  const prevButton = document.querySelector("#prev-track");
  const nextButton = document.querySelector("#next-track");
  const muteButton = document.querySelector("#mute-track");
  const progress = document.querySelector("#track-progress");

  playButton.addEventListener("click", () => {
    if (!youtubePlayer) {
      return;
    }

    if (youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
      youtubePlayer.pauseVideo();
      return;
    }

    youtubePlayer.playVideo();
  });

  prevButton.addEventListener("click", () => {
    youtubePlayer?.previousVideo();
  });

  nextButton.addEventListener("click", () => {
    youtubePlayer?.nextVideo();
  });

  muteButton.addEventListener("click", () => {
    if (!youtubePlayer) {
      return;
    }

    wasMuted = !wasMuted;

    if (wasMuted) {
      youtubePlayer.mute();
      setMutedState(true);
      return;
    }

    youtubePlayer.unMute();
    setMutedState(false);
  });

  progress.addEventListener("input", () => {
    isSeeking = true;
  });

  progress.addEventListener("change", () => {
    if (!youtubePlayer?.getDuration) {
      isSeeking = false;
      return;
    }

    youtubePlayer.seekTo((Number(progress.value) / 100) * youtubePlayer.getDuration(), true);
    isSeeking = false;
  });

  controlsReady = true;
}

function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player("youtube-player", {
    width: "1",
    height: "1",
    videoId: firstVideoId,
    playerVars: {
      listType: "playlist",
      list: playlistId,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        bindControls();
        updateTrackInfo();
        updateProgress();
        window.setInterval(() => {
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

renderIcons();
setupMouseParallax();
updateClockAndMood();
window.setInterval(updateClockAndMood, 60 * 1000);
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
