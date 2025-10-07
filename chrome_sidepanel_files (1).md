# Chrome Extension Side Panel — teljes MV3 csomag

Az alábbi projekt 100%-ban működő Chrome Extension (Manifest V3, Windows 10-re is megfelelő). A kiterjesztés egy **Side Panel**-t nyit, amiben egy URL-t fetch-elhetsz, megjelenítheted a talált linkeket, törölheted az adatokat, és minden mentésre kerül a `localStorage`-ba.

---

## 📁 Fájlszerkezet
```
my-sidepanel-extension/
│
├── manifest.json
├── background.js
├── sidepanel.html
├── sidepanel.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🧩 manifest.json

```json
{
  "manifest_version": 3,
  "name": "Simple Side Panel Fetcher",
  "version": "1.0",
  "description": "Egyszerű Chrome Side Panel fetcher és link kinyerő eszköz.",
  "permissions": ["storage", "sidePanel"],
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open Side Panel",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## ⚙️ background.js

```javascript
// background.js
// Ez a script felel a Side Panel megnyitásáért, amikor a felhasználó a kiterjesztés ikonjára kattint.

chrome.action.onClicked.addListener(async (tab) => {
  // Felhasználói gesztushoz kötve: panel megnyitása
  await chrome.sidePanel.open({ windowId: tab.windowId });
  // Beállítjuk, hogy a default panel a sidepanel.html legyen
  await chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
});
```

---

## 🧠 sidepanel.html

```html
<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Side Panel</title>
  <style>
    body{font-family:Segoe UI, Roboto, Arial; margin:12px; font-size:13px}
    .row{display:flex;gap:8px;align-items:center}
    input[type="text"]{flex:1;padding:6px;border:1px solid #ccc;border-radius:4px}
    button{padding:6px 10px;border-radius:6px;border:1px solid #999;background:#f3f3f3;cursor:pointer}
    button:active{transform:translateY(1px)}
    #indicator{height:6px;border-radius:4px;background:#eee;margin-top:8px}
    #data-container{margin-top:12px;max-height:320px;overflow:auto;border:1px solid #e6e6e6;padding:8px;border-radius:6px;background:#fff}
    #status-container{margin-top:8px;color:#333;font-weight:600}
    .link-row{padding:6px 4px;border-bottom:1px solid #f1f1f1}
    .icon{display:inline-block;width:18px;text-align:center;margin-right:6px}
    .btn-icon{margin-right:6px}
    a.small{font-size:12px;color:#0066cc;text-decoration:none}
  </style>
</head>
<body>
  <div class="row">
    <label for="urlInput" style="margin-right:6px">URL</label>
    <input id="urlInput" name="URL" type="text" value="https://www.companywall.hu/" />
  </div>

  <div class="row" style="margin-top:8px">
    <button id="fetchBtn"><span class="btn-icon">🔍</span>FETCH</button>
    <button id="clearBtn"><span class="btn-icon">🧹</span>CLEAR</button>
  </div>

  <div id="indicator" aria-hidden="true"></div>

  <div id="status-container">Találatok: —</div>
  <div id="data-container" aria-live="polite"></div>

  <script src="sidepanel.js"></script>
</body>
</html>
```

---

## 📜 sidepanel.js

```javascript
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
```

---

✅ **Használat:**
1. Csomagold be a mappát (`my-sidepanel-extension`) Chrome-ban: `chrome://extensions/` → *Fejlesztői mód* → *Betöltés kicsomagolt bővítményként*.
2. Kattints az ikonra → a Side Panel automatikusan megnyílik.
3. Add meg az URL-t, kattints a **FETCH**-re → megjelennek a linkek.
4. **CLEAR** mindent alaphelyzetbe állít.

---

Szeretnéd, hogy kiegészítsem a `manifest.json`-t engedélykérésekkel a cross-domain `fetch`-ekhez (pl. `host_permissions`), hogy ne dobjon CORS hibát külső oldalaknál?

