(function () {
  const pre = document.getElementById("prompt");
  const base = location.href.replace(/[^/]*$/, "");
  pre.textContent = pre.textContent.replace(/@@SITE_URL@@/g, base);
  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(pre.textContent).then(() => { document.getElementById("copied").textContent = "Copied."; setTimeout(() => { document.getElementById("copied").textContent = ""; }, 2000); });
  });
})();
