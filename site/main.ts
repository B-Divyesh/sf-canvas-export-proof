import './style.css';
import { captureReturnedLicense, getCachedLicenseState, saveLicense, verifyLicense } from '../lib/license';

const offline = document.querySelector<HTMLElement>('#offline')!;
const restoreButton = document.querySelector<HTMLButtonElement>('#restore-button')!;
const restoreForm = document.querySelector<HTMLFormElement>('#restore-form')!;
const licenseStatus = document.querySelector<HTMLElement>('#license-status')!;

function updateConnection() { offline.hidden = navigator.onLine; }
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

restoreButton.addEventListener('click', () => {
  restoreForm.hidden = !restoreForm.hidden;
  restoreButton.setAttribute('aria-expanded', String(!restoreForm.hidden));
  if (!restoreForm.hidden) document.querySelector<HTMLInputElement>('#license')?.focus();
});

restoreForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>('#license')!;
  saveLicense(input.value);
  licenseStatus.textContent = 'Verifying…';
  const verdict = await verifyLicense(true);
  licenseStatus.textContent = verdict.valid ? '✓ License verified. Paste this same token into the extension’s Team pack panel.' : verdict.reason === 'offline' ? 'Could not reach verification. Check your connection and try again.' : 'This license is not active.';
});

async function initializeLicense() {
  const returned = captureReturnedLicense();
  const cached = getCachedLicenseState();
  if (returned || cached.token) {
    if (returned) {
      restoreForm.hidden = false;
      restoreButton.setAttribute('aria-expanded', 'true');
      document.querySelector<HTMLInputElement>('#license')!.value = returned;
    }
    licenseStatus.textContent = cached.valid ? '✓ Team pack license saved on this browser.' : 'Checking saved license…';
    const verdict = await verifyLicense(Boolean(returned));
    licenseStatus.textContent = verdict.valid ? '✓ License saved. Copy the token above into the extension’s Team pack panel.' : verdict.reason === 'offline' ? 'Offline. Your previously verified status is unchanged.' : 'License no longer active.';
  }
}

void initializeLicense();
