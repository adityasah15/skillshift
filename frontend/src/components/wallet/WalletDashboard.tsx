"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      title={kind === "deposit" ? "Add test funds" : "Withdraw funds"}
      description={
        kind === "deposit"
          ? "Top up your available balance instantly."
          : "Move available balance out of SkillShift."
      }
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
        <p className="rounded-[14px] bg-surface-soft px-4 py-3 text-[13px] leading-6 text-text-muted">
          {kind === "deposit"
            ? "Test mode — no real money moves. Funds appear as Available immediately."
            : "Only available balance can be withdrawn — amounts held in escrow stay protected until orders complete."}
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
    year: "numeric",
  });
  const outgoing = tx.type === "WITHDRAWAL" || tx.type === "ESCROW_HOLD";
  return (
    <li className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{TX_LABEL[tx.type]}</p>
        <p className="mt-0.5 truncate text-[13px] text-text-subtle">
          {tx.description} · {date}
        </p>
      </div>
      <p className={`shrink-0 font-mono text-[15px] font-bold ${outgoing ? "text-text-muted" : "text-success"}`}>
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
                    o.roleLabel === "Client order" &&
                    (o.status === "IN_PROGRESS" ||
                      o.status === "DELIVERED" ||
                      o.status === "DISPUTED"),
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
        <div className="skeleton-shimmer h-44 rounded-[18px]" />
        <div className="skeleton-shimmer h-14 rounded-[14px]" />
        <div className="skeleton-shimmer h-14 rounded-[14px]" />
      </div>
    );
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

  const heldLine = held;

  return (
    <div>
      <section aria-label="Balance" className="rounded-[18px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-text-subtle">Available in wallet</p>
            <p className="text-3xl font-mono font-bold break-words sm:text-4xl">{formatINR(balance)}</p>
            {heldLine !== null && heldLine > 0 && (
              <p className="mt-1.5 text-sm font-medium text-warning">
                + {formatINR(heldLine)} held in escrow across open orders
              </p>
            )}
            <p className="mt-2 text-[13px] text-text-muted">Test mode — no real money moves.</p>
          </div>
          <StatusBadge status="ACTIVE" />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setDialog("deposit")}>Add funds</Button>
          {role === "FREELANCER" || role === "CLIENT" ? (
            <Button variant="secondary" onClick={() => setDialog("withdraw")}>
              Withdraw
            </Button>
          ) : (
            <p className="self-center text-[13px] text-text-muted">
              Withdrawals are available to clients and freelancers.
            </p>
          )}
        </div>
      </section>

      <section aria-label="Transactions" className="mt-6">
        <h2 className="text-lg font-semibold">History</h2>
        {transactions.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No transactions yet"
              body="Deposits, escrow holds, releases, and withdrawals will appear here with clear labels."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {transactions.map((t) => (
              <TransactionRow key={t.id} tx={t} />
            ))}
          </ul>
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
