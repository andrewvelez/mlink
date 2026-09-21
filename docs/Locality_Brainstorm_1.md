# Locality Brainstorm 1

## Context

This discussion considered freely available APIs, datasets, and JavaScript libraries for implementing U.S. geolocation and locality-aware search in a dating app.

The central constraint is strict: **the geographic infrastructure must cost $0 to use**. Commercial “free tiers” do not satisfy that requirement because location is a universal feature whose API usage would grow directly with application activity.

## Core observation

The application's geographic data and its real-time location state are different things:

- Administrative boundaries, place names, counties, ZIP Code Tabulation Areas, and similar geographic facts are static or change slowly.
- User coordinates, user-to-cell membership, and nearby-user search results are dynamic and may change continuously—particularly when someone uses the app while traveling in a car.

Consequently, the real-time problem is primarily a **dynamic indexing and search problem**, not a real-time geodata-fetching problem. Static geographic data should be downloaded, indexed, and cached rather than purchased repeatedly through metered requests.

## Recommended $0 components

| Need | Component | Purpose |
| --- | --- | --- |
| Obtain current coordinates | Browser `navigator.geolocation` | Provides device coordinates after user permission without an application API charge |
| Geographic grid | [`h3-js`](https://h3geo.org/docs/) | Converts coordinates to hierarchical cells and finds neighboring cells |
| Distance and geometry | [Turf.js](https://turfjs.org/) | Performs distance, bounding-box, buffer, and point-in-polygon calculations locally |
| U.S. boundaries | [Census TIGER/Line files](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) | Supplies places, counties, county subdivisions, roads, ZCTAs, and other geographic boundaries |
| Place-name index | [Census Gazetteer files](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html) | Supplies geographic identifiers, names, areas, and representative coordinates |
| Additional geographic names | [USGS GNIS](https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data) | Supplies populated-place and geographic-feature names as public-domain data |
| Optional lookup fallback | [Census Geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) | Converts U.S. addresses or coordinates to Census geography without a usage charge |
| Optional boundary fallback | [TIGERweb REST](https://tigerweb.geo.census.gov/tigerwebmain/TIGERweb_restmapservice.html) | Provides hosted queries against Census geographic layers |
| Optional map rendering | [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) or [Leaflet](https://leafletjs.com/) | Renders maps but does not itself provide production map tiles |

The Census APIs are useful fallbacks, but the application's essential search path should continue functioning without them.

## Recommended search model

```text
device position update
    -> convert latitude/longitude to an H3 cell
    -> compare the new cell with the user's indexed cell
    -> update the user's location record when necessary
    -> search the current and neighboring cells
    -> calculate distance for the resulting candidates
    -> filter and order the results
```

Each active user needs only an ephemeral location record resembling:

```js
{
  userId,
  latitude,
  longitude,
  cell,
  updatedAt
}
```

Changing a user's location updates that record; it does not rebuild the geographic index. H3 supplies a coarse candidate set, after which Turf or a direct great-circle calculation can determine more precise distances.

## Controlling location updates

The app should not write a new server location for every GPS event. Updates can be coalesced according to meaningful changes:

- Ignore small movements consistent with GPS jitter.
- Update the indexed record after crossing an H3 boundary or moving a chosen minimum distance.
- Refresh periodically so an unchanged position does not become stale.
- Increase the movement threshold at driving speed.
- Expire location records that have not been refreshed within the accepted time window.

The user's search origin may change more often than their locality label. A label such as a city or census-designated place only needs to be recomputed when the relevant geographic area changes.

## Density-adaptive H3 cells

H3's hierarchy fits the proposed density-adaptive location model. Approximate average cell areas are:

| Resolution | Average area |
| ---: | ---: |
| 6 | 36.1 km² |
| 7 | 5.16 km² |
| 8 | 0.74 km² |
| 9 | 0.105 km² |

The application can index at a relatively fine resolution and move to parent cells when a wider search area or stronger location privacy is appropriate. H3 cells are for proximity indexing; Census boundaries remain responsible for human-readable locality labels.

## Static locality resolution

A durable zero-cost locality pipeline would:

1. Download current Census boundary and Gazetteer files during a build or maintenance process.
2. Convert them into a compact application-specific spatial index, potentially split by state or region.
3. Resolve coordinates against that local index.
4. Cache mappings such as `H3 cell -> locality` because every user in the same cell will usually receive the same result.
5. Use the Census Geocoder only for missing or ambiguous cases.

This turns locality resolution into an occasional cache-fill operation rather than an API request made for every user or location update.

## Services rejected from the critical path

The public OpenStreetMap Nominatim service is nominally free of charge but is unsuitable as a universal production dependency. Its public-service policy limits an application to one request per second, prohibits client-side autocomplete, requires caching and attribution, and permits access to be withdrawn. The standard OpenStreetMap tile service is similarly best-effort and prohibits bulk or offline downloading.

Commercial providers with free monthly quotas are also excluded. Their cost becomes nonzero after usage crosses the provider's threshold, making application growth a billing risk.

## Conclusion

The appropriate architecture is unmetered:

- Coordinates originate on the user's device.
- H3 indexes changing user locations.
- Local computation performs proximity searches and distance calculations.
- Downloaded Census and USGS data supply relatively static locality information.
- Cached locality results prevent repeated geographic lookup work.
- Public government APIs serve only as optional fallbacks.

Although locality-aware search operates in real time, it does not require a real-time paid geodata service. The changing information is the user's position and its index membership; the underlying geographic reference data can remain local and cacheable.
