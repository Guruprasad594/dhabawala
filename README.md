# Dhaba Wala Radio

A Netlify-ready static website inspired by the live-radio feel of Deluxe Saloon,
restyled as an Indian dhaba music page and linked to this YouTube playlist:

https://www.youtube.com/watch?v=5MIGQBpVeqs&list=PLgObA3pAqvOh87Z03QG8Z4xE-uqlAWSBy

## Run Locally

Open `index.html` directly in a browser, or run a tiny static server:

```bash
python -m http.server 8888
```

Then visit `http://localhost:8888`.

## Deploy To Netlify

Option 1: Drag and drop this folder into Netlify&apos;s manual deploy UI.

Option 2: Connect the Git repository in Netlify and use:

- Build command: leave empty
- Publish directory: `.`

The `netlify.toml` file already contains the publish setting.

## Audio-Only Playback

YouTube does not provide a clean official audio-only embed for playlists, so
the visible video player has been removed.

For true in-page audio, add direct MP3, OGG, or radio stream URLs to
`audioTracks` in `script.js`, for example:

```js
const audioTracks = [
  { title: "Dhaba Mix", note: "House playlist", src: "audio/dhaba-mix.mp3" },
];
```

You can place audio files in an `audio/` folder before deploying to Netlify.
