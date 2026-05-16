// Branding upload UI. Two stacked cards — one for the logo, one for
// the favicon — each carrying:
//   - A preview of the current asset (with a fallback when none is set)
//   - An <input type="file"> wired to the upload server action
//   - Spec notes (accepted formats, size cap, recommended dimensions)
//   - A "Remove" form that posts to the matching remove action
//
// The form is a server component because none of its interactivity
// needs client state: each <form> targets a server action directly,
// file inputs and submit buttons are native HTML, and the previews
// render the data URLs straight from the DB row.

import {
  brandingErrorMessage,
  FAVICON_LIMITS,
  LOGO_LIMITS,
} from '@/lib/branding';
import {
  removeFavicon,
  removeLogo,
  uploadFavicon,
  uploadLogo,
} from '@/app/actions/branding';

interface Props {
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  // Query-param error key set by the server actions on a failed upload
  // (e.g. 'logo-too-large', 'favicon-wrong-type'). Renders a banner
  // above the cards when present.
  error: string | null;
}

// Decode the action's error-key convention into a readable banner.
// Kept here (rather than in the action) because the page is where
// we already have the limits constants and the kind context.
function decodeError(error: string): string | null {
  const [kind, ...rest] = error.split('-');
  if (kind !== 'logo' && kind !== 'favicon') return null;
  const tail = rest.join('-');
  const map: Record<string, 'fileTooLarge' | 'fileWrongType' | 'fileEmpty'> = {
    'too-large': 'fileTooLarge',
    'wrong-type': 'fileWrongType',
    empty: 'fileEmpty',
  };
  const reason = map[tail];
  if (!reason) return null;
  return `${kind === 'logo' ? 'Logo' : 'Favicon'}: ${brandingErrorMessage(kind, reason)}`;
}

export default function BrandingForm({
  logoDataUrl,
  faviconDataUrl,
  error,
}: Props) {
  const errorMessage = error ? decodeError(error) : null;

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {/* --- Logo card ------------------------------------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-900">Logo</h2>
          <p className="text-sm text-stone-500">
            Replaces the &quot;Bedrock.fit&quot; wordmark in the site header.
          </p>
        </header>

        <div className="flex items-center gap-4">
          {/* Preview swatch sits on a slate background so a logo with
              transparent edges is visible. Fixed height matches the
              live header so an operator sees the final size at upload
              time without having to switch tabs. */}
          <div className="h-12 w-48 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt="Current logo"
                className="max-h-10 max-w-full object-contain"
              />
            ) : (
              <span className="text-sm font-semibold tracking-tight text-stone-700">
                Bedrock.fit
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400">
            {logoDataUrl ? 'Current logo' : 'No logo uploaded — wordmark fallback'}
          </span>
        </div>

        {/* Upload form. encType is multipart so the file input streams
            as a real File rather than a stringified path; the server
            action's `formData.get('logo')` gets a Blob-shaped value. */}
        <form
          action={uploadLogo}
          encType="multipart/form-data"
          className="space-y-3"
        >
          <div>
            <label
              htmlFor="logo-file"
              className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5"
            >
              Upload new logo
            </label>
            <input
              id="logo-file"
              name="logo"
              type="file"
              accept={LOGO_LIMITS.acceptedMime.join(',')}
              required
              className="block w-full text-sm text-stone-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-900 file:text-white hover:file:bg-stone-800 file:cursor-pointer"
            />
          </div>
          {/* Spec notes. Kept tight so they're scannable; the precise
              numbers come from the limits constant so the UI never
              drifts from what the validator actually accepts. */}
          <p className="text-[11px] text-stone-500 leading-relaxed">
            PNG, JPEG, WebP, or SVG. Maximum {LOGO_LIMITS.maxKb} KB. Recommended
            roughly {LOGO_LIMITS.recommendedWidthPx}&times;
            {LOGO_LIMITS.recommendedHeightPx}&nbsp;px with a transparent
            background; renders ~{LOGO_LIMITS.recommendedHeightPx}&nbsp;px tall
            in the header. Up to {LOGO_LIMITS.recommendedMaxWidthPx}&nbsp;px
            wide is fine — wider images are scaled down by the browser.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="text-sm bg-stone-900 text-white hover:bg-stone-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Upload logo
            </button>
          </div>
        </form>

        {/* Remove form is separate so each button has its own submit
            target and a stray "Enter" in the file input never
            accidentally clears the existing logo. */}
        {logoDataUrl ? (
          <form action={removeLogo}>
            <button
              type="submit"
              className="text-xs text-stone-500 hover:text-red-700 underline underline-offset-2 transition-colors"
            >
              Remove current logo
            </button>
          </form>
        ) : null}
      </section>

      {/* --- Favicon card ----------------------------------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-900">Favicon</h2>
          <p className="text-sm text-stone-500">
            Shown in browser tabs, bookmarks, and the home-screen icon when a
            visitor pins the site. Browsers cache favicons aggressively — a
            new upload may take a hard refresh (or up to a day) to appear.
          </p>
        </header>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {faviconDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconDataUrl}
                alt="Current favicon"
                className="max-h-8 max-w-8 object-contain"
              />
            ) : (
              <span
                aria-hidden="true"
                className="text-[10px] text-stone-400 tracking-tight"
              >
                ico
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400">
            {faviconDataUrl
              ? 'Current favicon'
              : 'No favicon uploaded — built-in default'}
          </span>
        </div>

        <form
          action={uploadFavicon}
          encType="multipart/form-data"
          className="space-y-3"
        >
          <div>
            <label
              htmlFor="favicon-file"
              className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5"
            >
              Upload new favicon
            </label>
            <input
              id="favicon-file"
              name="favicon"
              type="file"
              accept={FAVICON_LIMITS.acceptedMime.join(',')}
              required
              className="block w-full text-sm text-stone-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-900 file:text-white hover:file:bg-stone-800 file:cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            PNG, ICO, or SVG. Maximum {FAVICON_LIMITS.maxKb} KB. Recommended
            square: {FAVICON_LIMITS.recommendedMinSizePx}&times;
            {FAVICON_LIMITS.recommendedMinSizePx}&nbsp;px minimum,&nbsp;
            {FAVICON_LIMITS.recommendedSizePx}&times;
            {FAVICON_LIMITS.recommendedSizePx}&nbsp;px is the sweet spot, up
            to {FAVICON_LIMITS.recommendedMaxSizePx}&times;
            {FAVICON_LIMITS.recommendedMaxSizePx}&nbsp;px for high-DPI
            displays.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="text-sm bg-stone-900 text-white hover:bg-stone-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Upload favicon
            </button>
          </div>
        </form>

        {faviconDataUrl ? (
          <form action={removeFavicon}>
            <button
              type="submit"
              className="text-xs text-stone-500 hover:text-red-700 underline underline-offset-2 transition-colors"
            >
              Remove current favicon
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
