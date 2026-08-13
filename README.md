# Dhaba Wala Radio

A Netlify-ready static website inspired by the live-radio feel of Deluxe Saloon,
restyled as an old Indian dhaba music station with a floating player bar.

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

## Playlist

The site uses the official YouTube embedded player and IFrame API to play this
playlist:

https://www.youtube.com/watch?v=5MIGQBpVeqs&list=PLgObA3pAqvOh87Z03QG8Z4xE-uqlAWSBy

The background illustration is local at `assets/old-dhaba-night.svg`, so it is
ready for Netlify without extra image hosting.
