/**
 * @author Andrew Velez <andrewvelez@outlook.com>
 * @license MIT
 * @description Tests authentication state and startup page selection.
 */

import { expect, test } from "bun:test";
import { AuthenticationState, getAuthenticationState, getStartPage } from "../src/web/js/authentication.js";

test("authentication remains Unknown until implemented", () => {
  expect(getAuthenticationState()).toBe(AuthenticationState.Unknown);
});

test.each([
  [AuthenticationState.Unknown, "about.html"],
  [AuthenticationState.Known, "home.html"],
  [AuthenticationState.Authenticated, "home.html"],
])("selects the startup page for %s", (state, page) => {
  expect(getStartPage(state)).toBe(page);
});

test("rejects unsupported authentication states", () => {
  expect(() => getStartPage("invalid")).toThrow("Unsupported authentication state.");
});
