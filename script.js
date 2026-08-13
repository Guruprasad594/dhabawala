const rotations = [
  { label: "Tandoor Subah", start: 5, end: 9 },
  { label: "Chai Counter", start: 9, end: 17 },
  { label: "Shaam Ki Thali", start: 17, end: 22 },
  { label: "Highway Raat", start: 22, end: 5 },
];

const audioTracks = [
  // Add direct MP3, OGG, or radio stream URLs here for true audio-only playback.
  // Example: { title: "Dhaba Mix", note: "House playlist", src: "audio/dhaba-mix.mp3" },
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

function setupAudioPlayer() {
  const audio = document.querySelector("#dhaba-audio");
  const title = document.querySelector("#track-title");
  const note = document.querySelector("#track-note");
  const previousButton = document.querySelector("#prev-track");
  const nextButton = document.querySelector("#next-track");
  let trackIndex = 0;

  function setTrack(index) {
    const track = audioTracks[index];

    if (!track || !audio) {
      return;
    }

    trackIndex = index;
    audio.src = track.src;
    title.textContent = track.title;
    note.textContent = track.note;
    audio.load();
  }

  if (!audioTracks.length) {
    previousButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  previousButton.addEventListener("click", () => {
    setTrack((trackIndex - 1 + audioTracks.length) % audioTracks.length);
    audio.play();
  });

  nextButton.addEventListener("click", () => {
    setTrack((trackIndex + 1) % audioTracks.length);
    audio.play();
  });

  audio.addEventListener("ended", () => {
    setTrack((trackIndex + 1) % audioTracks.length);
    audio.play();
  });

  setTrack(0);
}

setupAudioPlayer();
