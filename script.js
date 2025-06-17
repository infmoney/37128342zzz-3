const devToolsCheck = () => {
  let open = false;
  const threshold = 160;
  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if ((widthThreshold || heightThreshold) && !open) {
      open = true;
      document.getElementById('warn').innerText = "DevTools Detected. Logging...";
      fetch("/log-devtools", { method: "POST" });
      setTimeout(() => { window.close(); }, 10000);
    }
  }, 500);
};

devToolsCheck();

async function generateKey() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const fingerprint = result.visitorId;

  const res = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint })
  });

  const data = await res.json();
  alert(data.message);
}