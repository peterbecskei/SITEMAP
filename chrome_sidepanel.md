# Chrome Extension Side Panel — English Summary (MV3)

This project is a complete **Chrome Extension (Manifest V3)** designed to open a custom **Side Panel** for fetching and analyzing webpage content. It allows users to enter a URL, fetch its HTML content, extract links, and display them in a simple list. All results are stored in `localStorage`, and the user can clear the data anytime. The extension opens automatically in the Side Panel when the user clicks the browser action icon.

---

## 🧩 Features Overview
- **Manifest V3 compatible** (tested on Windows 10)
- Uses the **Side Panel API** (not a popup)
- **Input field** for a custom URL (default: `https://www.companywall.hu/`)
- **FETCH** button — retrieves the page content using `fetch()`
- **CLEAR** button — resets the UI and clears `localStorage`
- **Data container** — displays extracted links line by line
- **Status container** — shows number of links found or fetch status
- **Indicator bar** — visual signal for fetch success or idle state
- **Local storage** — preserves user input, results, and state between sessions
- **Cross-domain fetch enabled** via `host_permissions: ["<all_urls>"]`
- Lightweight, clean, and easy-to-extend codebase

---

## 📁 File Structure
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

## 🔍 How It Works
1. When the user clicks the extension icon, `background.js` opens the **Side Panel**.
2. `sidepanel.html` provides the UI (URL input, buttons, and containers).
3. `sidepanel.js` handles all logic:
   - Fetches the HTML from the provided URL.
   - Extracts all found links (`href`, `http(s)://`, and `www.` patterns).
   - Displays the list of links with a count.
   - Stores everything locally for persistence.
   - Provides a **Clear** function to reset everything.
4. The **indicator bar** changes color to reflect state:
   - Grey = idle
   - Yellow = fetching
   - Green = success

---

## ⚙️ manifest.json (key settings)
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "sidePanel"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "background.js" },
  "side_panel": { "default_path": "sidepanel.html" },
  "action": { "default_title": "Open Side Panel" }
}
```

---

## 🚀 How to Install
1. Go to **chrome://extensions**.
2. Enable **Developer Mode**.
3. Click **Load unpacked** and select the extension folder.
4. Click the extension icon — the **Side Panel** opens automatically.
5. Enter a URL and press **FETCH** to retrieve and list all links.

---

## 💡 Notes
- Works on all major domains due to `host_permissions`.
- Uses default icons (can be replaced later).
- Code is modular and written in plain JavaScript — no frameworks.
- Clean UI using pure HTML/CSS, optimized for clarity and simplicity.

---

**Summary:**  
This Chrome Extension demonstrates a minimal, production-ready implementation of the **Side Panel API** with full fetch and parsing functionality, ideal for testing link extraction, DOM analysis, or integrating into larger data inspection workflows.

