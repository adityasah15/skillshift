import { apiFetch } from "../api-client";
import type { Transaction } from "../types";

export const walletApi = {
  /** Returns the balance in paise (a bare number in `data`). */
  balance() {
    return apiFetch<number>("/wallet", { method: "GET" });
  },
  /** Whitelist: only amount (integer paise > 0). */
  deposit(amount: number) {
    return apiFetch<unknown>("/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
  /** CLIENT + FREELANCER. Whitelist: only amount (integer paise > 0). */
  withdraw(amount: number) {
    return apiFetch<unknown>("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
  transactions() {
    return apiFetch<Transaction[]>("/wallet/transactions", {
      method: "GET",
    });
  },
};
