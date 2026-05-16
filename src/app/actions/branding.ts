'use server';

// Server actions backing /admin/branding — upload / remove the
// site logo + favicon. Every action guards with requireAdmin(),
// validates the file via lib/branding.ts, writes through the
// singleton helper in lib/site-branding.ts, and busts the
// `site-branding` cache tag so the next SiteHeader render and the
// next generateMetadata pass pick up the change.
//
// The two upload actions live as a matched pair with their "remove"
// counterparts because the admin form has dedicated "Remove" buttons
// for each asset; we don't want the operator to have to upload a
// blank file to clear an existing logo.

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import {
  brandingErrorMessage,
  validateFaviconFile,
  validateLogoFile,
} from '@/lib/branding';
import { setBrandingField, SITE_BRANDING_TAG } from '@/lib/site-branding';

// Where the form lives. Redirecting back here on every outcome keeps
// the action a plain POST-redirect-GET so the form clears cleanly
// across refreshes and double-submits are idempotent.
const BRANDING_PATH = '/admin/branding';

// Friendly error reasons are surfaced via a query string the page
// reads on render. The keys are stable across actions so the page
// only has to handle a small set: 'logo-too-large', 'logo-wrong-type',
// 'logo-empty', and the favicon equivalents.
function errorKey(kind: 'logo' | 'favicon', validationError: string): string {
  const tail =
    validationError === 'fileTooLarge'
      ? 'too-large'
      : validationError === 'fileWrongType'
        ? 'wrong-type'
        : 'empty';
  return `${kind}-${tail}`;
}

// After every mutation we bump the branding tag (so getBranding()'s
// cache returns the new value) AND the root path (so the home page
// re-renders with the new header logo and the new favicon `<link>`).
function afterMutation(): never {
  updateTag(SITE_BRANDING_TAG);
  revalidatePath('/', 'layout');
  redirect(BRANDING_PATH);
}

function afterError(key: string): never {
  redirect(`${BRANDING_PATH}?error=${encodeURIComponent(key)}`);
}

// --- Logo ----------------------------------------------------------

export async function uploadLogo(formData: FormData): Promise<void> {
  await requireAdmin();

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    afterError(errorKey('logo', 'fileEmpty'));
  }

  const result = await validateLogoFile(file);
  if (!result.ok) afterError(errorKey('logo', result.error));

  await setBrandingField('logoDataUrl', result.dataUrl);
  afterMutation();
}

export async function removeLogo(): Promise<void> {
  await requireAdmin();
  await setBrandingField('logoDataUrl', null);
  afterMutation();
}

// --- Favicon -------------------------------------------------------

export async function uploadFavicon(formData: FormData): Promise<void> {
  await requireAdmin();

  const file = formData.get('favicon');
  if (!(file instanceof File) || file.size === 0) {
    afterError(errorKey('favicon', 'fileEmpty'));
  }

  const result = await validateFaviconFile(file);
  if (!result.ok) afterError(errorKey('favicon', result.error));

  await setBrandingField('faviconDataUrl', result.dataUrl);
  afterMutation();
}

export async function removeFavicon(): Promise<void> {
  await requireAdmin();
  await setBrandingField('faviconDataUrl', null);
  afterMutation();
}

// Re-export for the page component so it can render exactly the
// message that produced the error — no duplicated strings.
export { brandingErrorMessage };
