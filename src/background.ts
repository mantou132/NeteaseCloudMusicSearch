import { omnibox, Omnibox, tabs } from 'webextension-polyfill';

const SEARCH_API_URL = `https://files.xianqiao.wang/https://neteasecloudmusic.api.soraharu.com/search/suggest`;
const SEARCH_RES_URL = `https://music.163.com/#/search/m/`;
const SONG_RES_URL = `https://music.163.com/#/song`;
const ARTIST_RES_URL = `https://music.163.com/#/artist`;
const ALBUM_RES_URL = `https://music.163.com/#/album`;

omnibox.setDefaultSuggestion({
  description: `Search in music.163.com`,
});

interface Artist {
  id: number;
  name: string;
  alias: string[];
  transNames?: string[];
}
interface Album {
  id: number;
  name: string;
  artist: Artist;
}
interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration?: number; // ms
}

interface SearchSuggestResult {
  result?: {
    songs?: Song[];
    albums?: Album[];
    artists?: Artist[];
  };
}

// Update the suggestions whenever the input is changed.
omnibox.onInputChanged.addListener(async (text, addSuggestions) => {
  const res = await fetch(`${SEARCH_API_URL}?keywords=${text}`);
  const data: SearchSuggestResult = await res.json();
  const suggestions: Omnibox.SuggestResult[] = [];
  const songs = data.result?.songs;
  const artists = data.result?.artists;
  const albums = data.result?.albums;
  songs?.forEach(({ id, name, artists }) => {
    suggestions.push({
      content: `${SONG_RES_URL}?id=${id}`,
      description: `Song: ${name} - ${artists.map(e => e.name).join()}`,
    });
  });
  artists?.forEach(({ id, name }) => {
    suggestions.push({
      content: `${ARTIST_RES_URL}?id=${id}`,
      description: `Artist: ${name}`,
    });
  });
  albums?.forEach(({ id, name, artist }) => {
    suggestions.push({
      content: `${ALBUM_RES_URL}?id=${id}`,
      description: `Album: ${name} - ${artist.name}`,
    });
  });
  addSuggestions(suggestions);
});

// Open the page based on how the user clicks on a suggestion.
omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;
  if (!text.startsWith('http')) {
    // Update the url if the user clicks on the default suggestion.
    url = `${SEARCH_RES_URL}?s=${text}`;
  }
  switch (disposition) {
    case 'currentTab':
      tabs.update({ url });
      break;
    case 'newForegroundTab':
      tabs.create({ url });
      break;
    case 'newBackgroundTab':
      tabs.create({ url, active: false });
      break;
  }
});
