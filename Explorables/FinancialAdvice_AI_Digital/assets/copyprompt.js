(function () {
  const btn = document.getElementById("copy"), pre = document.getElementById("prompt");
  if (!btn || !pre) return;
  const base = location.href.replace(/[^/]*$/, "");
  pre.textContent = pre.textContent.replace(/@@SITE_URL@@/g, base);
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(pre.textContent).then(() => { document.getElementById("copied").textContent = "Copied."; setTimeout(() => { document.getElementById("copied").textContent = ""; }, 2000); });
  });
})();
