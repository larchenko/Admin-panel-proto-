// tailwind.js — loads the shared theme into Tailwind's browser build.
//
// Why this exists: the Tailwind browser build only reads CSS from
// <style type="text/tailwindcss"> blocks inside the page and cannot @import
// a separate file. We want ONE theme.css shared by every page, so this script
// fetches it, drops it into such a block, then loads Tailwind itself.
//
// Usage in every page (inside <head>):
//   <script src="./assets/tailwind.js"></script>
// Adjust the relative path from deeper folders, e.g. "../assets/tailwind.js".

(() => {
  const base = document.currentScript.src.replace(/tailwind\.js(\?.*)?$/, '');
  const TAILWIND_CDN = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.14';

  fetch(base + 'theme.css')
    .then((r) => r.text())
    .then((css) => {
      const style = document.createElement('style');
      style.type = 'text/tailwindcss';
      style.textContent = css;
      document.head.appendChild(style);

      const script = document.createElement('script');
      script.src = TAILWIND_CDN;
      document.head.appendChild(script);
    });
})();
