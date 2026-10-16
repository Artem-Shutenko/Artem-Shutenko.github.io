const CLIENT_ID = 'd431cd66c7064b928663d0fa219af11e'; // Ваш Client ID
const REDIRECT_URI = window.location.origin + window.location.pathname; // Автоматически текущий адрес сайта
const SCOPES = 'playlist-read-private playlist-read-collaborative user-read-private user-read-email';

// Генерация PKCE
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Проверка при загрузке страницы: есть ли код в URL после редиректа от Spotify
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    // Очищаем URL от ?code=...
    window.history.replaceState({}, document.title, window.location.pathname);
    await exchangeCodeForToken(code);
  }

  checkAuth();

  document.getElementById('login-btn').onclick = initiateLogin;
  document.getElementById('refresh-btn').onclick = loadUserPlaylists;
});

async function initiateLogin() {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);

  window.location.href = authUrl.toString();
}

async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) return;

  const response = await fetch('https://accounts.accounts.spotify.com/api/token', { // исправлено на accounts.spotify.com в реальном коде ниже
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  
  // Примечание: правильный эндпоинт токенов ниже без опечатки в accounts:
  // 'https://accounts.spotify.com/api/token'
}

// Переписанный обмен токена без ошибок:
async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) return;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('spotify_access_token', data.access_token);
  }
}

function checkAuth() {
  const token = localStorage.getItem('spotify_access_token');
  if (token) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    loadUserPlaylists();
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
  }
}

async function loadUserPlaylists() {
  const token = localStorage.getItem('spotify_access_token');
  try {
    const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderPlaylists(data.items || []);
    } else if (res.status === 401) {
      localStorage.removeItem('spotify_access_token');
      checkAuth();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderPlaylists(playlists) {
  const container = document.getElementById('playlists-container');
  container.innerHTML = '';
  playlists.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `<span>${pl.name}</span> <button class="btn" style="padding: 6px 12px; font-size: 14px;" onclick="exportPlaylist('${pl.id}', '${pl.name.replace(/'/g, "\\'")}')">CSV</button>`;
    container.appendChild(card);
  });
}

// Функция экспорта треков (веб-версия обходит ограничения расширений и может использовать пагинацию)
async function exportPlaylist(playlistId, playlistName) {
  const token = localStorage.getItem('spotify_access_token');
  try {
    let tracksItems = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    // Постраничная загрузка всех треков
    while (nextUrl) {
      const res = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) break;
      const data = await res.json();
      if (data.items) tracksItems = tracksItems.concat(data.items);
      nextUrl = data.next;
    }

    if (tracksItems.length === 0) {
      alert('Плейлист пуст.');
      return;
    }

    let csvContent = "\uFEFFTrack URI;ISRC;Track Name;Album Name;Artist Name(s);Release Date;Duration (ms);Popularity;Explicit;Added At;Added By;Genres;Record Label;Danceability;Energy;Key;Loudness;Mode;Speechiness;Acousticness;Instrumentalness;Liveness;Valence;Tempo;Time Signature\n";
    
    tracksItems.forEach(item => {
      if (item && item.track) {
        const t = item.track;
        const uri = `spotify:track:${t.id || ''}`;
        const isrc = (t.external_ids && t.external_ids.isrc) ? t.external_ids.isrc : '';
        const trackName = `"${(t.name || '').replace(/"/g, '""')}"`;
        const albumName = `"${(t.album && t.album.name ? t.album.name : '').replace(/"/g, '""')}"`;
        const artists = `"${(t.artists ? t.artists.map(a => a.name).join(', ') : '').replace(/"/g, '""')}"`;
        const releaseDate = (t.album && t.album.release_date) ? t.album.release_date : '';
        const duration = t.duration_ms || '';
        const popularity = t.popularity || 0;
        const explicit = t.explicit ? 'true' : 'false';
        const addedAt = item.added_at || '';
        const addedBy = (item.added_by && item.added_by.id) ? item.added_by.id : '';

        csvContent += `${uri};${isrc};${trackName};${albumName};${artists};${releaseDate};${duration};${popularity};${explicit};${addedAt};${addedBy};;;;;;;;;;;;;;\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlistName.replace(/[^a-z0-9а-яё]/gi, '_').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error(err);
    alert('Ошибка экспорта плейлиста.');
  }
}