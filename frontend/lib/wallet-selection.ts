/** Session-scoped wallet selection for navigation between investigation views. */

const STORAGE_KEY = "btc-scope:selected-wallet-id";
export const WALLET_SELECTION_EVENT = "btc-scope:wallet-selected";

export function getSelectedWalletId(): string | null {
  if (typeof window === "undefined") return null;
  const walletId = window.sessionStorage.getItem(STORAGE_KEY);
  return walletId && /^W\d{6}$/i.test(walletId) ? walletId.toUpperCase() : null;
}

export function setSelectedWalletId(walletId: string): void {
  if (typeof window === "undefined" || !/^W\d{6}$/i.test(walletId)) return;
  const normalized = walletId.toUpperCase();
  window.sessionStorage.setItem(STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(WALLET_SELECTION_EVENT, { detail: normalized }));
}
