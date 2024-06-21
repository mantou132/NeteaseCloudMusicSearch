import { omnibox, Omnibox, tabs } from 'webextension-polyfill';

const SEARCH_API_URL = `https://music.xianqiao.wang/neteaseapiv2/search/suggest`;
const SEARCH_RES_URL = `https://music.163.com/#/search/m/`;

omnibox.setDefaultSuggestion({
  description: `Search in music.163.com`,
});

interface Artist {
  name: string;
  alias: string[];
  transNames?: string[];
}
interface Album {
  name: string;
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
  songs?.forEach(({ name }) => {
    suggestions.push({ content: `${SEARCH_RES_URL}?s=${name}&type=1`, description: `Search song: ${name}` });
  });
  artists?.forEach(({ name }) => {
    suggestions.push({ content: `${SEARCH_RES_URL}?s=${name}&type=100`, description: `Search artist: ${name}` });
  });
  albums?.forEach(({ name }) => {
    suggestions.push({ content: `${SEARCH_RES_URL}?s=${name}&type=10`, description: `Search album: ${name}` });
  });
  addSuggestions(suggestions);
});

// Open the page based on how the user clicks on a suggestion.
omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;
  if (!text.startsWith(SEARCH_RES_URL)) {
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
