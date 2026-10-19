"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { RatingStars } from "@/components/ui/RatingStars";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { usersApi, type AccountProfile } from "@/lib/api/users";
import { useSessionToken } from "@/lib/session";
import { assertUploadable, confirmUpload, putToS3, requestPresigned, uploadPortfolioFile } from "@/lib/upload";

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
        // The links editor manages http(s) links only — uploaded file keys
        // (e.g. `portfolios/<id>/<file>`) render in the uploads list below and
        // are re-sent unchanged on save.
        setPortfolioText(
          (data.profile?.portfolioUrls ?? [])
            .filter((u) => /^https?:\/\//i.test(u))
            .join("\n"),
        );
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
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]" aria-label="Loading profile">
        <div className="skeleton-shimmer h-80 rounded-[10px]" />
        <div className="skeleton-shimmer h-[480px] rounded-[10px]" />
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
  const uploadedKeys = (profile?.portfolioUrls ?? []).filter(
    (u) => !/^https?:\/\//i.test(u),
  );
  const roleLabel = account.role.charAt(0) + account.role.slice(1).toLowerCase();

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
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <section aria-label="Account" className="rounded-[10px] border border-border bg-surface p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={profile?.displayName ?? account.email}
              src={profile?.avatarUrl}
              size="xl"
            />
            <label className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] border border-border px-4 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft">
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
            {avatarError && (
              <p role="alert" className="mt-2 text-[13px] text-danger">
                {avatarError}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-border pt-4 text-center">
            <h2 className="truncate text-lg font-semibold text-text">
              {profile?.displayName ?? "Your profile"}
            </h2>
            <p className="truncate text-sm text-text-muted">{account.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[12px] font-semibold text-text-muted">
                {roleLabel} account
              </span>
              {account.isEmailVerified ? (
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success">
                  Email verified
                </span>
              ) : (
                <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[12px] font-semibold text-warning">
                  Email unverified
                </span>
              )}
            </div>
            {profile && profile.totalReviews > 0 && (
              <div className="mt-3 flex justify-center">
                <RatingStars value={profile.rating} count={profile.totalReviews} />
              </div>
            )}
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Member since</dt>
              <dd className="tabular text-text">
                {new Date(account.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Reviews</dt>
              <dd className="tabular text-text">{profile?.totalReviews ?? 0}</dd>
            </div>
          </dl>
        </section>
      </aside>

      <section aria-label="Edit profile" className="rounded-[10px] border border-border bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold">Public profile</h2>
          <p className="mt-1 text-sm text-text-muted">
            This is what clients and freelancers see.
          </p>
        </div>

        <form onSubmit={save} className="mt-5 flex flex-col gap-6">
          <fieldset className="min-w-0 space-y-4">
            <legend className="text-[13px] font-semibold text-text-subtle">
              Basics
            </legend>
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
          </fieldset>

          <fieldset className="min-w-0 space-y-4 border-t border-border pt-5">
            <legend className="text-[13px] font-semibold text-text-subtle">
              Skills
            </legend>
            <Input
              label="Skills"
              name="skills"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Logo design, Web development"
              hint="Comma-separated; these appear on your public profile."
            />
          </fieldset>

          <fieldset className="min-w-0 space-y-4 border-t border-border pt-5">
            <legend className="text-[13px] font-semibold text-text-subtle">
              Portfolio
            </legend>
            <Textarea
              label="Portfolio links"
              name="portfolio"
              value={portfolioText}
              onChange={(e) => setPortfolioText(e.target.value)}
              placeholder="One link per line, starting with https://"
            />
            <div>
              <label
                className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] border border-border px-4 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft ${
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
                <p role="status" className="mt-1.5 text-[13px] font-medium text-primary">
                  {portfolioProgress}
                </p>
              )}
              {portfolioError && (
                <p role="alert" className="mt-1.5 text-[13px] text-danger">
                  {portfolioError}
                </p>
              )}
              {uploadedKeys.length > 0 && (
                <ul className="mt-2 space-y-1.5" aria-label="Uploaded portfolio files">
                  {uploadedKeys.map((key) => (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-[8px] bg-surface-soft/70 px-3.5 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {key.substring(key.lastIndexOf("/") + 1)}
                      </span>
                      <span className="shrink-0 px-2 text-[13px] text-text-subtle">
                        uploaded
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </fieldset>

          {saveError && (
            <p role="alert" className="text-sm text-danger">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
            {saved && (
              <p role="status" className="text-sm font-medium text-success">
                Saved — your public profile is up to date.
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
