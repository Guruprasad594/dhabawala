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
let tickActive = false;
let lastTrackId = "";
let clockMinute = -1;

const els = {};

function cacheElements() {
  els.time = document.querySelector("#station-time");
  els.date = document.querySelector("#station-date");
  els.mood = document.querySelector("#now-label");
  els.title = document.querySelector("#track-title");
  els.source = document.querySelector("#track-source");
  els.photo = document.querySelector("#song-photo");
  els.progress = document.querySelector("#track-progress");
  els.current = document.querySelector("#current-time");
  els.duration = document.querySelector("#duration-time");
  els.play = document.querySelector("#play-track");
  els.mute = document.querySelector("#mute-track");
  els.equalizer = document.querySelector(".equalizer");
  els.station = document.querySelector(".station-screen");
}

function renderIcons() {
  window.lucide?.createIcons?.();
}

function setupMouseParallax() {
  const root = els.station;
  const targets = [...document.querySelectorAll("[data-depth]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!root || !targets.length || reduceMotion.matches) {
    return;
  }

  root.classList.add("is-parallax");

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

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      queuePaint();
    },
    { passive: true },
  );

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
  const minute = Number(timeParts.find((part) => part.type === "minute").value);

  return {
    hour24,
    minute,
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

function updateClockAndMood(force = false) {
  const { hour24, minute, dateLabel, time } = getIndiaParts();

  if (!force && minute === clockMinute) {
    return;
  }

  clockMinute = minute;

  const mood = moods.find((item) => isActiveHour(hour24, item.start, item.end));

  els.time.textContent = time;
  els.date.textContent = `${dateLabel} - IST`;
  els.time.setAttribute("datetime", new Date().toISOString());

  if (mood) {
    els.mood.textContent = `NOW PLAYING - ${mood.label}`;
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
  els.play.classList.toggle("is-playing", isPlaying);
  els.play.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  els.equalizer?.classList.toggle("is-idle", !isPlaying);
}

function setMutedState(isMuted) {
  els.mute.classList.toggle("is-muted", isMuted);
  els.mute.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
}

function updateTrackInfo() {
  if (!youtubePlayer?.getVideoData) {
    return;
  }

  const data = youtubePlayer.getVideoData();
  const videoId = data?.video_id || firstVideoId;

  if (videoId === lastTrackId && data?.title) {
    return;
  }

  lastTrackId = videoId;

  const title = data?.title || "Dhaba Wala Playlist";
  const author = data?.author || "YouTube Playlist";

  els.title.textContent = title;
  els.source.textContent = `${author} - YouTube playlist`;
  els.photo.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  els.photo.alt = `${title} cover art`;
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

  els.progress.value = (current / duration) * 100;
  els.current.textContent = formatTime(current);
  els.duration.textContent = formatTime(duration);
}

function startTickLoop() {
  if (tickActive) {
    return;
  }

  tickActive = true;

  const tick = () => {
    if (document.hidden) {
      tickActive = false;
      return;
    }

    updateClockAndMood();
    updateProgress();

    if (youtubePlayer?.getPlayerState?.() === YT.PlayerState.PLAYING) {
      updateTrackInfo();
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

function bindControls() {
  if (controlsReady) {
    return;
  }

  const prevButton = document.querySelector("#prev-track");
  const nextButton = document.querySelector("#next-track");
  const progress = els.progress;

  els.play.addEventListener("click", () => {
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

  els.mute.addEventListener("click", () => {
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

  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select, [contenteditable=true]")) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      els.play.click();
    }

    if (event.code === "ArrowRight") {
      event.preventDefault();
      nextButton.click();
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();
      prevButton.click();
    }

    if (event.code === "KeyM") {
      event.preventDefault();
      els.mute.click();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateClockAndMood(true);
      startTickLoop();
    }
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
        updateClockAndMood(true);
        startTickLoop();
      },
      onStateChange: (event) => {
        const isPlaying = event.data === YT.PlayerState.PLAYING;
        setPlayingState(isPlaying);

        if (isPlaying || event.data === YT.PlayerState.PAUSED) {
          lastTrackId = "";
          updateTrackInfo();
        }
      },
    },
  });
}

function init() {
  cacheElements();
  renderIcons();
  setupMouseParallax();
  updateClockAndMood(true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
