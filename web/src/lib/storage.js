export const getStorageNumber = (key, fallback = 0) => {
  const raw = window.localStorage.getItem(key);
  if (raw === null || raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const setStorageNumber = (key, value) => {
  if (!Number.isFinite(value)) return;
  window.localStorage.setItem(key, String(value));
};
