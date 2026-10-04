import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const field =
  "w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-[15px] text-text placeholder:text-text-subtle transition hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, ...rest }: InputProps) {
  const fieldId = id ?? rest.name;
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-sm font-medium text-text"
      >
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${field} ${error ? "border-danger focus:border-danger focus:ring-danger-soft" : ""}`}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-[13px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, ...rest }: TextareaProps) {
  const fieldId = id ?? rest.name;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-sm font-medium text-text"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        rows={4}
        className={`${field} min-h-[112px] resize-y ${error ? "border-danger focus:border-danger focus:ring-danger-soft" : ""}`}
        {...rest}
      />
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
