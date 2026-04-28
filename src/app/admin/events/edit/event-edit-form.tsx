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
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none transition-colors"
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

      {/* Sponsor block — "presented by" slot. Optional; the public page
          hides the stripe entirely when name and logo are both empty.
          Three independent fields so a sponsor can be text-only, logo-
          only, or fully wired. */}
      <fieldset className="border-t border-slate-100 pt-6">
        <legend className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
          Sponsor
        </legend>
        <p className="text-xs text-stone-500 mb-4">
          Renders as a single &ldquo;presented by&rdquo; stripe under the event
          title. Leave all three blank to hide it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Sponsor name"
            name="sponsorName"
            defaultValue={val(metadata?.sponsorName)}
            placeholder="Acme Running Co."
          />
          <Field
            label="Sponsor URL"
            name="sponsorUrl"
            type="url"
            defaultValue={val(metadata?.sponsorUrl)}
            placeholder="https://acmerunning.com"
          />
          <Field
            label="Sponsor logo URL"
            name="sponsorLogoUrl"
            type="url"
            defaultValue={val(metadata?.sponsorLogoUrl)}
            placeholder="https://…/logo.svg"
          />
        </div>
      </fieldset>

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
      className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5"
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
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none transition-colors"
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
      className="inline-flex items-center gap-2 text-sm bg-stone-900 text-white px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors font-medium disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
