"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { ordersApi } from "@/lib/api/orders";
import { walletApi } from "@/lib/api/wallet";
import { useSessionToken } from "@/lib/session";
import { formatINR } from "@/lib/format";
import type { Role, Transaction } from "@/lib/types";

const TX_LABEL: Record<Transaction["type"], string> = {
  DEPOSIT: "Deposit",
  ESCROW_HOLD: "Held in escrow",
  ESCROW_RELEASE: "Released to freelancer",
  ESCROW_REFUND: "Refunded to wallet",
  WITHDRAWAL: "Withdrawal",
};

const TX_STYLE: Record<
  Transaction["type"],
  { tone: string; bg: string; icon: ReactNode }
> = {
  DEPOSIT: {
    tone: "text-success",
    bg: "bg-success-soft",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2.5v7M5.2 6.8L8 9.6l2.8-2.8M3 11.5v1.2c0 .4.3.8.8.8h8.4c.5 0 .8-.4.8-.8v-1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  ESCROW_HOLD: {
    tone: "text-warning",
    bg: "bg-warning-soft",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.8l5 2v3.7c0 3.2-2.1 5.6-5 6.7-2.9-1.1-5-3.5-5-6.7V3.8l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6 7.2v-1a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="5.4" y="7.2" width="5.2" height="3.6" rx="0.9" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  ESCROW_RELEASE: {
    tone: "text-success",
    bg: "bg-success-soft",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 13.5v-7M5.2 9.2L8 6.4l2.8 2.8M3 4.5V3.3c0-.4.3-.8.8-.8h8.4c.5 0 .8.4.8.8v1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  ESCROW_REFUND: {
    tone: "text-primary",
    bg: "bg-primary-soft",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3.5 5h6a3.5 3.5 0 110 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.8 2.8L3.3 5l2.5 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  WITHDRAWAL: {
    tone: "text-text-muted",
    bg: "bg-surface-soft",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 13.5v-7M5.2 9.2L8 6.4l2.8 2.8M3 4.5V3.3c0-.4.3-.8.8-.8h8.4c.5 0 .8.4.8.8v1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function toPaise(rupees: string): number | null {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function MoneyDialog({
  open,
  onClose,
  kind,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  kind: "deposit" | "withdraw";
  onDone: () => void;
}) {
  const [rupees, setRupees] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paise = toPaise(rupees);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (paise === null) {
      setError("Enter an amount greater than ₹0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (kind === "deposit") await walletApi.deposit(paise);
      else await walletApi.withdraw(paise);
      setRupees("");
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === "deposit" ? "Add funds" : "Withdraw funds"}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Amount (₹)"
          name="amount"
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          required
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          placeholder="1000"
          hint={paise !== null ? `= ${formatINR(paise)} added to your balance.` : undefined}
        />
        <p className="rounded-[10px] bg-surface-soft px-4 py-3 text-[13px] leading-6 text-text-muted">
          {kind === "deposit"
            ? "Added funds are available immediately."
            : "Only available balance can be withdrawn. Amounts held in escrow stay protected until orders complete."}
        </p>
        {error && (
          <p role="alert" className="text-sm leading-6 text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {kind === "deposit" ? "Add funds" : "Withdraw"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const date = new Date(tx.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const outgoing = tx.type === "WITHDRAWAL" || tx.type === "ESCROW_HOLD";
  const style = TX_STYLE[tx.type];

  return (
    <li className="flex items-start gap-3 rounded-[10px] border border-border bg-surface px-4 py-3.5">
      <span
        aria-hidden
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.tone}`}
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{TX_LABEL[tx.type]}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-text-muted">
          {tx.description}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-text-subtle">
          <span>{date}</span>
          {tx.orderId && (
            <Link
              href={`/orders/${tx.orderId}`}
              className="font-semibold text-primary hover:underline"
            >
              View order
            </Link>
          )}
        </p>
      </div>
      <p
        className={`tabular shrink-0 text-[15px] font-bold ${
          outgoing ? "text-danger" : "text-success"
        }`}
      >
        {outgoing ? "−" : "+"}
        {formatINR(tx.amount)}
      </p>
    </li>
  );
}

export function WalletDashboard() {
  const router = useRouter();
  const token = useSessionToken();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [held, setHeld] = useState<number | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [dialog, setDialog] = useState<"deposit" | "withdraw" | null>(null);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const [bal, txns, me] = await Promise.all([
          walletApi.balance(),
          walletApi.transactions().catch(() => ({ data: [] as Transaction[] })),
          authApi.me().catch(() => null),
        ]);
        if (cancelled) return;
        setBalance(bal.data);
        setTransactions(txns.data);
        setRole(me?.data.role ?? null);
        // Escrow truth comes from open orders, not txn history: the release
        // leg posts to the freelancer's history, so txn math overcounts held
        // on the client side after completion. Best-effort — hides on failure.
        try {
          const { data: orders } = await ordersApi.list();
          if (!cancelled) {
            setHeld(
              orders
                .filter(
                  (o) =>
                    (o.roleLabel === "Client order" &&
                      o.status !== "COMPLETED" &&
                      o.status !== "CANCELLED" &&
                      o.status !== "REFUNDED") ||
                    (o.roleLabel === "Freelancer order" &&
                      (o.status === "IN_PROGRESS" || o.status === "DELIVERED")),
                )
                .reduce((sum, o) => sum + o.price, 0),
            );
          }
        } catch {
          if (!cancelled) setHeld(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError) setFailed(err.message);
        else setFailed("We could not reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  useEffect(() => {
    if (role === "ADMIN") router.replace("/admin");
  }, [role, router]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view your wallet"
        body="Balance and transaction history live here once you're logged in."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fwallet") }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading wallet">
        <div className="skeleton-shimmer h-40 rounded-[10px]" />
        <div className="skeleton-shimmer h-24 rounded-[10px]" />
        <div className="skeleton-shimmer h-16 rounded-[10px]" />
        <div className="skeleton-shimmer h-16 rounded-[10px]" />
      </div>
    );
  }

  // Admins moderate the marketplace and never hold funds.
  if (role === "ADMIN") {
    return <div className="skeleton-shimmer h-40 rounded-[10px]" aria-label="Redirecting" />;
  }

  if (failed || balance === null) {
    return (
      <ErrorState
        title="Could not load your wallet"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const releasedTotal = transactions
    .filter((tx) => tx.type === "ESCROW_RELEASE")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const refundedTotal = transactions
    .filter((tx) => tx.type === "ESCROW_REFUND")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const third =
    role === "FREELANCER"
      ? {
          label: "Released to you",
          value: releasedTotal,
          note: "Recorded payouts from completed orders.",
        }
      : role === "CLIENT"
        ? {
            label: "Refunded to you",
            value: refundedTotal,
            note: "Returned from cancelled or disputed orders.",
          }
        : null;

  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const label = new Date(tx.createdAt).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const list = groups.get(label) ?? [];
    list.push(tx);
    groups.set(label, list);
  }
  const grouped = [...groups.entries()].sort(
    (a, b) =>
      +new Date(b[1][0]?.createdAt ?? 0) - +new Date(a[1][0]?.createdAt ?? 0),
  );

  return (
    <div>
      <section aria-label="Available balance" className="rounded-[10px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-text-subtle">Available</p>
            <p className="tabular mt-1 text-3xl font-bold break-words sm:text-4xl">
              {formatINR(balance)}
            </p>
            <p className="mt-1.5 text-[13px] text-text-muted">
              {role === "FREELANCER" ? "Ready to withdraw." : "Ready to spend or withdraw."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role !== "FREELANCER" && (
              <Button onClick={() => setDialog("deposit")}>Add funds</Button>
            )}
            <Button variant="secondary" onClick={() => setDialog("withdraw")}>
              Withdraw
            </Button>
          </div>
        </div>
      </section>

      <div className={`mt-4 grid gap-4 ${third ? "sm:grid-cols-2" : ""}`}>
        <div className="rounded-[10px] border border-border bg-surface p-5">
          <p className="text-[13px] text-text-subtle">
            {role === "FREELANCER" ? "In escrow for your orders" : "Held in escrow"}
          </p>
          <p className="tabular mt-1 text-2xl font-bold">
            {held === null ? "-" : formatINR(held)}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-text-muted">
            {role === "FREELANCER"
              ? "Releases when clients approve deliveries."
              : "Protected across your open orders."}
          </p>
        </div>
        {third && (
          <div className="rounded-[10px] border border-border bg-surface p-5">
            <p className="text-[13px] text-text-subtle">{third.label}</p>
            <p className="tabular mt-1 text-2xl font-bold">
              {formatINR(third.value)}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-text-muted">
              {third.note}
            </p>
          </div>
        )}
      </div>

      <section aria-label="Transactions" className="mt-6">
        <h2 className="text-lg font-semibold">History</h2>
        {transactions.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No transactions yet"
              body="Your deposits, escrow holds, releases, and withdrawals will appear here."
            />
          </div>
        ) : (
          <div className="mt-1">
            {grouped.map(([month, list]) => (
              <section key={month} aria-label={month} className="mt-5">
                <h3 className="text-[12px] font-semibold text-text-subtle">
                  {month}
                </h3>
                <ul className="mt-2 space-y-2">
                  {list.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <MoneyDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        kind={dialog ?? "deposit"}
        onDone={() => {
          setDialog(null);
          setAttempt((n) => n + 1);
        }}
      />
    </div>
  );
}
