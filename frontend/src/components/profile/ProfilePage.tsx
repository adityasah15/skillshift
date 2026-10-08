"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { usersApi, type AccountProfile } from "@/lib/api/users";
import { resolvePublicImage } from "@/lib/images";
import { useSessionToken } from "@/lib/session";
import { assertUploadable, confirmUpload, putToS3, requestPresigned, uploadPortfolioFile } from "@/lib/upload";

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ProfilePage() {
  const router = useRouter();
  const token = useSessionToken();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [portfolioText, setPortfolioText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [portfolioBusy, setPortfolioBusy] = useState(false);
  const [portfolioProgress, setPortfolioProgress] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await usersApi.me();
        if (cancelled) return;
        setAccount(data);
        setDisplayName(data.profile?.displayName ?? "");
        setBio(data.profile?.bio ?? "");
        setSkillsText((data.profile?.skills ?? []).join(", "));
        setPortfolioText((data.profile?.portfolioUrls ?? []).join("\n"));
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
        title="Log in to view your profile"
        body="Your public profile and account settings live here."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fprofile") }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading profile">
        <div className="skeleton-shimmer h-40 rounded-[18px]" />
        <div className="skeleton-shimmer h-64 rounded-[18px]" />
      </div>
    );
  }

  if (failed || !account) {
    return (
      <ErrorState
        title="Could not load your profile"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const profile = account.profile;
  const avatarImg = resolvePublicImage(profile?.avatarUrl);
  const uploadedKeys = (profile?.portfolioUrls ?? []).filter(
    (u) => !/^https?:\/\//i.test(u),
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    const portfolioUrls = portfolioText.split("\n").map((s) => s.trim()).filter(Boolean);
    const badUrl = portfolioUrls.find((u) => !/^https?:\/\//i.test(u));
    if (badUrl) {
      setSaveError(`Portfolio links must start with http(s):// — check “${badUrl.slice(0, 40)}”.`);
      setSaving(false);
      return;
    }
    // Uploaded file keys are stored alongside links server-side. Re-send
    // the stored keys so a profile save never wipes uploads (the backend
    // accepts keys as well as URLs in this array).
    const storedUploads = (account?.profile?.portfolioUrls ?? []).filter(
      (u) => !/^https?:\/\//i.test(u),
    );
    try {
      await usersApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        skills,
        portfolioUrls: [...portfolioUrls, ...storedUploads.filter((k) => !portfolioUrls.includes(k))],
      });
      const { data } = await usersApi.me();
      setAccount(data);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiRequestError) setSaveError(err.message);
      else setSaveError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPortfolio(fileList: FileList | null) {
    const ownerId = account?.id;
    if (!fileList || !ownerId || portfolioBusy) return;
    const picked = Array.from(fileList).slice(0, 5);
    setPortfolioBusy(true);
    setPortfolioError(null);
    try {
      for (let i = 0; i < picked.length; i++) {
        const f = picked[i];
        setPortfolioProgress(
          picked.length > 1 ? `Uploading file ${i + 1} of ${picked.length}…` : "Uploading file…",
        );
        // Confirm appends the key to portfolioUrls server-side. The keys
        // are not URLs, so they stay out of the links editor below (which
        // PATCHes URL-only arrays) and render in the uploads list instead.
        await uploadPortfolioFile(ownerId, f, i, picked.length);
      }
      const { data } = await usersApi.me();
      setAccount(data);
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : "Portfolio upload failed. Please retry.");
      try {
        const { data } = await usersApi.me();
        setAccount(data);
      } catch {
        // Best-effort refresh only; the error above is what matters.
      }
    } finally {
      setPortfolioBusy(false);
      setPortfolioProgress(null);
    }
  }
  async function uploadAvatar(file: File) {
    const ownerId = account?.id;
    if (!ownerId) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      assertUploadable(file);
      if (!file.type.startsWith("image/")) throw new Error("Only JPG or PNG images work for avatars.");
      const presigned = await requestPresigned({
        resource: "avatar",
        resourceId: ownerId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
      await putToS3(presigned.url, file);
      await confirmUpload({
        resource: "avatar",
        resourceId: ownerId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        key: presigned.key,
      });
      const { data } = await usersApi.me();
      setAccount(data);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Avatar upload failed. Please retry.");
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section aria-label="Account" className="rounded-[18px] border border-border bg-surface p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {avatarImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarImg} alt={profile?.displayName ?? "Profile photo"} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {initials(profile?.displayName ?? account.email)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{profile?.displayName ?? "Your profile"}</h2>
            <p className="truncate text-sm text-text-muted">{account.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
              <span className="rounded-full bg-surface-soft px-3 py-1 font-semibold">
                {account.role.charAt(0) + account.role.slice(1).toLowerCase()} account
              </span>
              {account.isEmailVerified ? (
                <span className="rounded-full bg-success-soft px-3 py-1 font-semibold text-success">Email verified</span>
              ) : (
                <span className="rounded-full bg-warning-soft px-3 py-1 font-semibold text-warning">Email unverified</span>
              )}
              {profile && profile.totalReviews > 0 && (
                <span className="font-mono">
                  ★ {profile.rating.toFixed(1)} · {profile.totalReviews} review{profile.totalReviews === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[12px] border border-border px-4 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft">
            {avatarBusy ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              disabled={avatarBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadAvatar(f);
              }}
              className="sr-only"
            />
          </label>
        </div>
        {avatarError && (
          <p role="alert" className="mt-3 text-sm text-danger">{avatarError}</p>
        )}
      </section>

      <section aria-label="Edit profile" className="rounded-[18px] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Public profile</h2>
        <p className="mt-1 text-sm text-text-muted">This is what clients and freelancers see.</p>
        <form onSubmit={save} className="mt-4 flex flex-col gap-4">
          <Input
            label="Display name"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should people address you?"
            maxLength={120}
            required
          />
          <Textarea
            label="Bio"
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What you do, and what you're great at."
            maxLength={2000}
          />
          <Input
            label="Skills"
            name="skills"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="Logo design, Web development"
            hint="Comma-separated."
          />
          <Textarea
            label="Portfolio links"
            name="portfolio"
            value={portfolioText}
            onChange={(e) => setPortfolioText(e.target.value)}
            placeholder="One link per line, starting with https://"
          />
          <div>
            <label
              className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-[12px] border border-border px-4 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft ${
                portfolioBusy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {portfolioBusy ? "Uploading…" : "Upload portfolio files"}
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf,application/zip"
                multiple
                disabled={portfolioBusy}
                onChange={(e) => {
                  uploadPortfolio(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-[13px] text-text-muted">
              JPG, PNG, PDF, or ZIP — up to 5MB each, max 5 at a time. Uploaded files save immediately and appear below.
            </p>
            {portfolioProgress && (
              <p role="status" className="mt-1.5 text-[13px] font-medium text-primary">{portfolioProgress}</p>
            )}
            {portfolioError && (
              <p role="alert" className="mt-1.5 text-[13px] text-danger">{portfolioError}</p>
            )}
            {uploadedKeys.length > 0 && (
              <ul className="mt-2 space-y-1.5" aria-label="Uploaded portfolio files">
                {uploadedKeys.map((k) => (
                  <li
                    key={k}
                    className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-soft/70 px-3.5 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {k.substring(k.lastIndexOf("/") + 1)}
                    </span>
                    <span className="shrink-0 px-2 text-[13px] text-text-subtle">uploaded</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {saveError && (
            <p role="alert" className="text-sm text-danger">{saveError}</p>
          )}
          {saved && (
            <p role="status" className="text-sm font-medium text-success">Saved — your public profile is up to date.</p>
          )}
          <div>
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </section>

      <section aria-label="Your workspace" className="rounded-[18px] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Your workspace</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="secondary" onClick={() => router.push("/orders")}>Your orders</Button>
          <Button variant="secondary" onClick={() => router.push("/wallet")}>Wallet</Button>
          {account.role !== "CLIENT" && (
            <Button variant="secondary" onClick={() => router.push("/services/mine")}>Your services</Button>
          )}
        </div>
        <div className="mt-4">
          <StatusBadge status="ACTIVE" />
          <span className="ml-2 text-[13px] text-text-muted">
            Member since {new Date(account.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </section>
    </div>
  );
}
