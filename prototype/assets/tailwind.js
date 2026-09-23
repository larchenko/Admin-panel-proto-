// tailwind.js — loads the shared theme and component recipes into Tailwind's browser build.
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

  // Files are concatenated in this order: tokens first, then component recipes.
  const FILES = ['theme.css', 'components.css'];

  // Favicon: the logo mark, on every page. The ?v= query is the cache-buster —
  // browsers hold on to favicons long after the file changes; bump it when it does.
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  icon.href = base + 'logo-mark.svg?v=2026-09-23';
  document.head.appendChild(icon);

  // cache: 'no-cache' revalidates on every load, so an edited theme or recipe
  // shows up without a hard reload on the deployed site too.
  Promise.all(FILES.map((f) => fetch(base + f, { cache: 'no-cache' }).then((r) => r.text())))
    .then((parts) => parts.join('\n'))
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
