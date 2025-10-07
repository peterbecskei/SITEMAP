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