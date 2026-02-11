const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || window.location.origin;
const normalizedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
const loginUrl = `${normalizedBase}/Identity/Account/Login`;

export default function followIfLoginRedirect(response) {
  if (response.status === 401 || response.status === 403) {
    const returnUrl = encodeURIComponent(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
    window.location.href = `${loginUrl}?ReturnUrl=${returnUrl}`;
    return;
  }

  if (response.redirected && response.url.startsWith(loginUrl)) {
    const returnUrl = encodeURIComponent(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
    window.location.href = `${loginUrl}?ReturnUrl=${returnUrl}`;
  }
}
