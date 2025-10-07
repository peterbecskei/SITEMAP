// sidepanel.js — egyszerű és tiszta Side Panel logika

const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const clearBtn = document.getElementById('clearBtn');
const dataContainer = document.getElementById('data-container');
const statusContainer = document.getElementById('status-container');
const indicator = document.getElementById('indicator');

const STORAGE_KEYS = {
  content: 'URL_CONTENT',
  status: 'URL_STATUS',
  links: 'URL_LINKS',
  input: 'URL_INPUT'
};

function loadState() {
  const savedInput = localStorage.getItem(STORAGE_KEYS.input);
  if (savedInput) urlInput.value = savedInput;

  const linksJson = localStorage.getItem(STORAGE_KEYS.links);
  if (linksJson) {
    try {
      const links = JSON.parse(linksJson);
      renderLinks(links);
      setStatus(links.length);
      setIndicator(true);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEYS.links);
    }
  } else {
    resetView();
  }
}

function setStatus(count) {
  statusContainer.textContent = `Találatok: ${count}`;
  localStorage.setItem(STORAGE_KEYS.status, String(count));
}

function setIndicator(active) {
  indicator.style.background = active ? '#c8f7c5' : '#eee';
}

function renderLinks(links) {
  dataContainer.innerHTML = '';
  if (!links || links.length === 0) {
    dataContainer.textContent = 'Nincs megjeleníthető link.';
    return;
  }
  links.forEach(l => {
    const row = document.createElement('div');
    row.className = 'link-row';
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '🔗';
    const a = document.createElement('a');
    a.href = l;
    a.textContent = l;
    a.target = '_blank';
    a.className = 'small';
    row.appendChild(icon);
    row.appendChild(a);
    dataContainer.appendChild(row);
  });
}

function resetView() {
  dataContainer.innerHTML = '';
  statusContainer.textContent = 'Találatok: —';
  setIndicator(false);
}

function clearAll() {
  localStorage.clear();
  urlInput.value = '';
  resetView();
}

function extractLinksFromText(text, baseUrl) {
  const found = new Set();

  const hrefRegex = /href\s*=\s*['\"]([^'\"]+)['\"]/ig;
  let m;
  while ((m = hrefRegex.exec(text)) !== null) {
    try {
      found.add(new URL(m[1], baseUrl).href);
    } catch {}
  }

  const httpRegex = /((?:https?:)?\/\/[^"'\s<>]+)/ig;
  while ((m = httpRegex.exec(text)) !== null) {
    found.add(m[1]);
  }

  const wwwRegex = /\b(www\.[^\s"'<>]+)/ig;
  while ((m = wwwRegex.exec(text)) !== null) {
    found.add('https://' + m[1]);
  }

  return Array.from(found).sort();
}

async function doFetch() {
  const url = urlInput.value.trim();
  if (!url) return alert('Adj meg egy URL-t.');

  localStorage.setItem(STORAGE_KEYS.input, url);
  indicator.style.background = '#fff3b0';
  statusContainer.textContent = 'Fetchelés...';

  try {
    let fetchUrl = url.match(/^https?:\/\//i) ? url : 'https://' + url;
    const resp = await fetch(fetchUrl);
    const text = await resp.text();

    localStorage.setItem(STORAGE_KEYS.content, text);

    const links = extractLinksFromText(text, fetchUrl);
    localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(links));

    renderLinks(links);
    setStatus(links.length);
    setIndicator(true);
  } catch (err) {
    console.error('Fetch hiba:', err);
    statusContainer.textContent = 'Hiba: ' + (err.message || 'Ismeretlen hiba');
    setIndicator(false);
  }
}

fetchBtn.addEventListener('click', doFetch);
clearBtn.addEventListener('click', clearAll);
document.addEventListener('DOMContentLoaded', loadState);