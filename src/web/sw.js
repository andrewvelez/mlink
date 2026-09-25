/**
 * @author Andrew Velez
 * @license MIT
 * @description Precaches the PWA and serves each asset cache-first by revisioned URL.
 */

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
