const isPreviewHost = (hostname: string) =>
  hostname.startsWith("id-preview--") ||
  hostname.startsWith("preview--") ||
  hostname === "lovableproject.com" ||
  hostname.endsWith(".lovableproject.com") ||
  hostname === "lovableproject-dev.com" ||
  hostname.endsWith(".lovableproject-dev.com") ||
  hostname === "beta.lovable.dev" ||
  hostname.endsWith(".beta.lovable.dev");

const shouldRefuseServiceWorker = () =>
  !import.meta.env.PROD ||
  window.self !== window.top ||
  isPreviewHost(window.location.hostname) ||
  new URLSearchParams(window.location.search).get("sw") === "off";

const unregisterAppWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => registration.active?.scriptURL.endsWith("/sw.js") || registration.scope === `${window.location.origin}/`)
      .map((registration) => registration.unregister()),
  );
};

export const registerEnvlePwa = async () => {
  if (!("serviceWorker" in navigator)) return;
  if (shouldRefuseServiceWorker()) {
    await unregisterAppWorkers();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  });
};
