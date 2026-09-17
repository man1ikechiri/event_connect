import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-navy-500">
        {label}
        {required && (
          <span className="text-state-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-sm text-state-danger" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-navy-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid}
      className={cn(
        "h-10 w-full rounded-control border bg-white px-3 text-sm text-navy placeholder:text-navy-300",
        "focus:outline-none focus:ring-2 focus:ring-navy/20",
        invalid ? "border-state-danger focus:border-state-danger" : "border-surface-border focus:border-navy",
        className,
      )}
      {...props}
    />
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid}
      className={cn(
        "w-full resize-none rounded-control border bg-white px-3 py-2 text-sm text-navy placeholder:text-navy-300",
        "focus:outline-none focus:ring-2 focus:ring-navy/20",
        invalid ? "border-state-danger focus:border-state-danger" : "border-surface-border focus:border-navy",
        className,
      )}
      {...props}
    />
  );
});
