# Chrome Extension Side Panel — sidepanel.html + sidepanel.js (MV3)

Az alábbiakban két fájl található: **sidepanel.html** és **sidepanel.js**. Ezek önmagukban a Side Panel tartalmát adják — a kiterjesztés teljes telepítéséhez szükséged lesz egy `manifest.json`-ra is (kis megjegyzés a végén).

> A kód egyszerű, tiszta és kommentelt. Minden állapotot `localStorage`-ban tárolunk (kulcsok: `URL_CONTENT`, `URL_STATUS`, `URL_LINKS`, `URL_INPUT`).

---

## `sidepanel.html`

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

## `sidepanel.js`

```javascript
// sidepanel.js
// Tiszta, egyszerű MV3 side panel script

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

// Betöltés localStorage-ból a megnyitáskor
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
      // ha parse hiba -> törlés
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
  // törlés a nézetben és localStorage-ból
  localStorage.removeItem(STORAGE_KEYS.content);
  localStorage.removeItem(STORAGE_KEYS.status);
  localStorage.removeItem(STORAGE_KEYS.links);
  localStorage.removeItem(STORAGE_KEYS.input);
  urlInput.value = '';
  resetView();
}

// Link kibontó: href, http(s)://, www., és plain domain-ek előfordulása a HTML szövegben
function extractLinksFromText(text, baseUrl) {
  const found = new Set();

  // 1) href="..."
  const hrefRegex = /href\s*=\s*['\"]([^'\"]+)['\"]/ig;
  let m;
  while ((m = hrefRegex.exec(text)) !== null) {
    let link = m[1].trim();
    if (!link) continue;
    // abszolút / relatív kezelése
    try {
      const resolved = new URL(link, baseUrl).href;
      found.add(resolved);
    } catch (e) {
      found.add(link);
    }
  }

  // 2) http(s):// vagy //domain
  const httpRegex = /((?:https?:)?\/\/[^"'\s<>]+)/ig;
  while ((m = httpRegex.exec(text)) !== null) {
    found.add(m[1]);
  }

  // 3) www. előtagú egyszerű minták
  const wwwRegex = /\b(www\.[^\s"'<>]+)/ig;
  while ((m = wwwRegex.exec(text)) !== null) {
    let candidate = m[1];
    // előtte esetleg add https://
    try {
      const resolved = new URL('https://' + candidate).href;
      found.add(resolved);
    } catch (e) {
      found.add(candidate);
    }
  }

  return Array.from(found).sort();
}

async function doFetch() {
  const url = urlInput.value && urlInput.value.trim();
  if (!url) {
    alert('Adj meg egy URL-t.');
    return;
  }

  // elmentjük az inputot
  localStorage.setItem(STORAGE_KEYS.input, url);

  // vizuális jelzés
  indicator.style.background = '#fff3b0';
  statusContainer.textContent = 'Fetchelés...';

  try {
    // ha a felhasználó nem adott meg protokollt, megpróbáljuk https-sel
    let fetchUrl = url;
    if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = 'https://' + fetchUrl;

    const resp = await fetch(fetchUrl);
    const text = await resp.text();

    // mentés
    localStorage.setItem(STORAGE_KEYS.content, text);

    // linkeket keresünk
    const links = extractLinksFromText(text, fetchUrl);

    // mentjük a linklistát
    localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(links));
    setStatus(links.length);
    renderLinks(links);
    setIndicator(true);

  } catch (err) {
    console.error('Fetch hiba:', err);
    statusContainer.textContent = 'Hiba: ' + (err && err.message ? err.message : 'ismeretlen hiba');
    setIndicator(false);
    // töröljük korábbi contentet ha van
    localStorage.removeItem(STORAGE_KEYS.content);
    localStorage.removeItem(STORAGE_KEYS.links);
  }
}

// Események
fetchBtn.addEventListener('click', () => {
  doFetch();
});

clearBtn.addEventListener('click', () => {
  const proceed = true; // ha akarsz megerősítést, itt promptolhatsz
  if (proceed) clearAll();
});

// Betöltéskor
document.addEventListener('DOMContentLoaded', loadState);
```

---

### Rövid megjegyzések / telepítési tippek
1. A fenti fájlok a side panel tartalmát adják — szükséged lesz `manifest.json`-ra és egy installálható kiterjesztés szerkezetre. A manifest-hez MV3 példa (nem kötelező itt, de hasznos lehet):

```json
{
  "manifest_version": 3,
  "name": "Sample Side Panel",
  "version": "1.0",
  "description": "Egyszerű side panel példa",
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "permissions": ["storage"],
  "icons": { "16":"icon16.png", "48":"icon48.png", "128":"icon128.png" }
}
```

2. A Side Panel automatikus megnyitásához: a felhasználói gesztusnak kell lennie (pl. toolbar gomb megnyomása). A Side Panel tartalmát a `side_panel.default_path`-ban adod meg. Ha szeretnéd, segítek hozzáadni egy `background` vagy `action` logikát, amely felhasználói kattintásra nyitja a side panelt.

3. Ikonoknál egyszerűen használj alap ikon fájlokat (`icon16.png` stb.). A HTML-ben most emoji-k jelölik a gombokat, ahogy kérted.

---

Ha szeretnéd, elkészítem még a `manifest.json`-t és a minimális background/action fájlt is, hogy a Side Panel ténylegesen meg is nyíljon egy felhasználói kattintásra. Kívánod-e, hogy hozzáadjam azokat is?'}

