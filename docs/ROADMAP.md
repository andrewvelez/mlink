# ROADMAP
(tentative)


**The road to a working prototype.**  There are some assumptions that go along with this document.  The app tries with all its might to be a fully p2p local-first progressive web app (PWA).

## Data Storage

### User-owned data

All user owned data like profile data and images belongs to the user.  The definitive copy is locally stored.  It may be replicated elsewhere for sharing/searching purposes.  This data must remain encrypted.

### Non-User-owned app data

App-specific data will be stored locally first and synced with a backend server, if it's not already just stored statically.  Geo-data changes infrequently enough that it could be stored statically; or if the geo-data is large, then segmented by locality and cached.



## Locality

### Overview

The application's geographic data and its real-time location state are different things. Place names, zip codes, and similar are static or change slowly. User coordinates and nearby-user search results may change continuously (e.g. someone uses the app while traveling in a car).

### Location library

Tentatively, we'll be using Uber's H3 [https://h3geo.org/] for location-awareness.

### User profile location privacy

The user's profile location (aka the user) must be obscured but still usable in a location search.  The amount of obscurity should be configurable.  There are potentially only two types of users when it comes to locality;  those who want to hide their location and those that do not.  Those that want to hide their location can be centered to the city-level location.  Everyone else can be geo-specific to within a few meters.