const rotations = [
  { label: "Tandoor Subah", start: 5, end: 9 },
  { label: "Chai Counter", start: 9, end: 17 },
  { label: "Shaam Ki Thali", start: 17, end: 22 },
  { label: "Highway Raat", start: 22, end: 5 },
];

const audioTracks = [
  {
    title: "Butter Naan Bass",
    artist: "Dhaba Wala House Band",
    note: "Warm tandoor groove for the first order.",
    photo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
    root: 146.83,
    bpm: 92,
    duration: 32,
    melody: [0, 3, 5, 7, 5, 3, 0, -2],
  },
  {
    title: "Masala Chai Chorus",
    artist: "Dhaba Wala House Band",
    note: "Bright counter melody with a little tea-stall bounce.",
    photo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
    root: 164.81,
    bpm: 108,
    duration: 32,
    melody: [0, 2, 4, 7, 9, 7, 4, 2],
  },
  {
    title: "Highway Raat",
    artist: "Dhaba Wala House Band",
    note: "Slow late-night road mood for the last chai.",
    photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80",
    root: 130.81,
    bpm: 76,
    duration: 32,
    melody: [0, -2, 3, 5, 7, 5, 3, -2],
  },
];

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

updateRotation();
setInterval(updateRotation, 60 * 1000);

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function frequency(root, semitones) {
  return root * Math.pow(2, semitones / 12);
}

function noteEnvelope(time, length) {
  const attack = Math.min(1, time / 0.025);
  const release = Math.max(0, 1 - time / length);

  return attack * release;
}

function noise(time) {
  return Math.sin(time * 12491.77) * Math.sin(time * 317.13);
}

function sampleTrack(track, time) {
  const beat = 60 / track.bpm;
  const stepLength = beat / 2;
  const step = Math.floor(time / stepLength);
  const stepTime = time % stepLength;
  const melodyNote = track.melody[step % track.melody.length];
  const lead = frequency(track.root * 2, melodyNote);
  const bass = frequency(track.root, step % 8 < 4 ? 0 : -5);
  const kickTime = time % beat;
  const hatTime = time % (beat / 2);
  const clapTime = (time + beat / 2) % beat;

  let value = 0;

  value += Math.sin(2 * Math.PI * track.root * time) * 0.06;
  value += Math.sin(2 * Math.PI * track.root * 1.5 * time) * 0.035;
  value += Math.sin(2 * Math.PI * bass * time) * Math.exp(-kickTime * 4.2) * 0.22;
  value += Math.sin(2 * Math.PI * lead * time) * noteEnvelope(stepTime, stepLength) * 0.18;
  value += Math.sin(2 * Math.PI * lead * 2.01 * time) * noteEnvelope(stepTime, stepLength) * 0.045;
  value += Math.sin(2 * Math.PI * (82 - kickTime * 28) * kickTime) * Math.exp(-kickTime * 18) * 0.42;
  value += noise(time) * Math.exp(-hatTime * 42) * 0.045;

  if (clapTime < 0.11) {
    value += noise(time) * Math.exp(-clapTime * 18) * 0.08;
  }

  return Math.max(-0.95, Math.min(0.95, value));
}

function createTrackUrl(track) {
  if (track.url) {
    return track.url;
  }

  const sampleRate = 22050;
  const sampleCount = Math.floor(track.duration * sampleRate);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fadeOut = Math.min(1, (track.duration - time) / 0.4);
    const fadeIn = Math.min(1, time / 0.2);
    const value = sampleTrack(track, time) * fadeIn * fadeOut;

    view.setInt16(44 + index * 2, value * 32767, true);
  }

  track.url = URL.createObjectURL(new Blob([view], { type: "audio/wav" }));
  return track.url;
}

function setupAudioPlayer() {
  const audio = document.querySelector("#dhaba-audio");
  const title = document.querySelector("#track-title");
  const note = document.querySelector("#track-note");
  const barTitle = document.querySelector("#bar-title");
  const barArtist = document.querySelector("#bar-artist");
  const trackPhoto = document.querySelector("#track-photo");
  const barPhoto = document.querySelector("#bar-photo");
  const playButton = document.querySelector("#play-track");
  const previousButton = document.querySelector("#prev-track");
  const nextButton = document.querySelector("#next-track");
  const progress = document.querySelector("#track-progress");
  const currentTime = document.querySelector("#current-time");
  const durationTime = document.querySelector("#duration-time");
  const volume = document.querySelector("#volume-range");
  const trackPills = document.querySelectorAll(".track-pill");
  let trackIndex = 0;

  function updateProgress() {
    const track = audioTracks[index];

    if (!track || !audio.duration) {
      return;
    }

    progress.value = (audio.currentTime / track.duration) * 100;
    currentTime.textContent = formatTime(audio.currentTime);
  }

  function setTrack(index, autoplay = false) {
    const track = audioTracks[index];

    if (!track || !audio) {
      return;
    }

    const wasPlaying = autoplay || !audio.paused;
    trackIndex = index;
    audio.src = createTrackUrl(track);
    title.textContent = track.title;
    note.textContent = track.note;
    barTitle.textContent = track.title;
    barArtist.textContent = track.artist;
    trackPhoto.src = track.photo;
    barPhoto.src = track.photo.replace("w=900", "w=240");
    durationTime.textContent = formatTime(track.duration);
    currentTime.textContent = "0:00";
    progress.value = 0;
    trackPills.forEach((pill) => {
      pill.classList.toggle("is-selected", Number(pill.dataset.track) === index);
    });
    audio.load();

    if (wasPlaying) {
      audio.play();
    }
  }

  audio.volume = Number(volume.value);

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      return;
    }

    audio.pause();
  });

  previousButton.addEventListener("click", () => {
    setTrack((trackIndex - 1 + audioTracks.length) % audioTracks.length, true);
  });

  nextButton.addEventListener("click", () => {
    setTrack((trackIndex + 1) % audioTracks.length, true);
  });

  trackPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      setTrack(Number(pill.dataset.track), true);
    });
  });

  audio.addEventListener("play", () => {
    playButton.innerHTML = "&#10073;&#10073;";
    playButton.setAttribute("aria-label", "Pause");
  });

  audio.addEventListener("pause", () => {
    playButton.innerHTML = "&#9654;";
    playButton.setAttribute("aria-label", "Play");
  });

  audio.addEventListener("ended", () => {
    setTrack((trackIndex + 1) % audioTracks.length, true);
  });

  audio.addEventListener("timeupdate", updateProgress);

  progress.addEventListener("input", () => {
    audio.currentTime = (Number(progress.value) / 100) * audioTracks[trackIndex].duration;
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
  });

  setTrack(0);
}

setupAudioPlayer();
