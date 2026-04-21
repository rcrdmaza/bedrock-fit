'use client';

// Metadata edit form. Plain server action — no optimistic update, no
// client-side validation beyond HTML maxLength/required/type. The
// server action redirects back with `?saved=1` on success, which the
// page reads to render a flash.

import { useFormStatus } from 'react-dom';
import type { EventMetadata } from '@/lib/events';

interface Props {
  eventName: string;
  eventDate: string;
  raceCategory: string;
  metadata: EventMetadata | null;
  upsertAction: (formData: FormData) => void | Promise<void>;
}

function val(v: string | null | undefined): string {
  return v ?? '';
}

export default function EventEditForm({
  eventName,
  eventDate,
  raceCategory,
  metadata,
  upsertAction,
}: Props) {
  return (
    <form action={upsertAction} className="space-y-6">
      {/* Identity triple travels as hidden inputs — the server action
          decodes these and keys the upsert off the same values. Keeping
          them in the form (not the URL) means a user can't hand-tweak
          the event a submission belongs to. */}
      <input type="hidden" name="eventName" value={eventName} />
      <input type="hidden" name="eventDate" value={eventDate} />
      <input type="hidden" name="raceCategory" value={raceCategory} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="City" name="city" defaultValue={val(metadata?.city)} />
        <Field
          label="District / State"
          name="district"
          defaultValue={val(metadata?.district)}
        />
        <Field
          label="Country"
          name="country"
          defaultValue={val(metadata?.country)}
        />
      </div>

      <div>
        <Label htmlFor="summary">Summary</Label>
        <textarea
          id="summary"
          name="summary"
          rows={6}
          maxLength={8000}
          defaultValue={val(metadata?.summary)}
          placeholder="A paragraph or two about the course, weather, vibe…"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Route URL"
          name="routeUrl"
          type="url"
          defaultValue={val(metadata?.routeUrl)}
          placeholder="https://strava.com/routes/…"
        />
        <Field
          label="Route image URL"
          name="routeImageUrl"
          type="url"
          defaultValue={val(metadata?.routeImageUrl)}
          placeholder="https://…/map.png"
        />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5"
    >
      {children}
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: 'text' | 'url';
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={2000}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 text-sm bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
