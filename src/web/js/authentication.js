/**
 * @author Andrew Velez
 * @license MIT
 * @description Defines authentication states and selects the PWA startup page.
 */

/**
 * Proposed authentication states. Cookie presence alone does not authorize a user.
 * Unknown has no authentication cookie; Known has a cookie without authorization;
 * Authenticated has a cookie and authorization.
 * @type {{ Unknown: string, Known: string, Authenticated: string }}
 */
export const AuthenticationState = Object.freeze({
  Unknown: "unknown",
  Known: "known",
  Authenticated: "authenticated",
});

/**
 * @description Returns Unknown until authentication is implemented.
 * @returns {string} The current authentication state.
 */
export function getAuthenticationState() {
  return AuthenticationState.Unknown;
}

/**
 * @description Selects the startup page for a supported authentication state.
 * @param {string} state An AuthenticationState value.
 * @returns {string} The page filename relative to the application root.
 * @throws {Error} If the authentication state is unsupported.
 */
export function getStartPage(state) {
  if (state === AuthenticationState.Unknown) {
    return "about.html";
  } else if (state === AuthenticationState.Known || state === AuthenticationState.Authenticated) {
    return "home.html";
  } else {
    throw new Error("Unsupported authentication state.");
  }
}
