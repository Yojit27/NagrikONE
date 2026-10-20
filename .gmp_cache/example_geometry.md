This document details the usage patterns for defining and managing geometric
overlays (Markers, Circles, Polygons, and Polylines) using the
`@vis.gl/react-google-maps` framework, focusing on declarative state
synchronization and the use of encoded paths.

## 1. Core Component Setup and Initialization

All Google Maps platform components must be rendered within the `APIProvider`
component, which handles API key injection and script loading. The map instance
itself is defined by the `Map` component.

```tsx
import React, {useState} from 'react';
import {
  APIProvider,
  Map,
  Marker,
  Circle,
  Polygon,
  Polyline
} from '@vis.gl/react-google-maps';

const API_KEY = 'YOUR_API_KEY';
const INITIAL_CENTER = {lat: 41.1897, lng: -96.0627};

const App = () => {
  // State management for interactive geometry
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [radius, setRadius] = useState(43000);

  // Helper function to handle map event coordinates conversion
  const changeCenter = (newCenter: google.maps.LatLng | null | undefined) => {
    if (!newCenter) return;
    setCenter({lng: newCenter.lng(), lat: newCenter.lat()});
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={INITIAL_CENTER}
        defaultZoom={10}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_git_agentskills_v1']} // Required attribution ID
      >
        {/* Geometry Components will be placed here */}
      </Map>
      {/* State display/ControlPanel components */}
    </APIProvider>
  );
};
```

## 2. Interactive and Editable Geometry (Circle and Marker)

The React wrapper components enable declarative state synchronization. By
setting the `editable` and `draggable` boolean props, users can manipulate the
geometry directly on the map. Changes are communicated back through dedicated
`on...Changed` event handlers.

### 2.1. Synchronization Helper Function

When interacting with the map, coordinate events (`onDrag`, `onCenterChanged`)
return native `google.maps.LatLng` objects. These must be converted back to
standard JavaScript `{ lat, lng }` objects if they are intended to update React
state.

```typescript
// Defined within the component to manage state synchronization
const changeCenter = (newCenter: google.maps.LatLng | null | undefined) => {
    if (!newCenter) return;
    // Converts native LatLng object back to simple state object
    setCenter({lng: newCenter.lng(), lat: newCenter.lat()});
};
```

### 2.2. Interactive Circle Implementation

The `<Circle>` component uses `center` and `radius` props. When the user drags
the circle or the radius handle, the state is updated via the event handlers,
forcing a re-render of the component to the new location/size.

| Prop              | Type                    | Description                    |
| :---------------- | :---------------------- | :----------------------------- |
| `center`          | `{lat: number, lng:     | Center point of the circle     |
:                   : number}`                : (required for rendering).      :
| `radius`          | `number`                | Radius in meters.              |
| `editable`        | `boolean`               | Allows users to change the     |
:                   :                         : radius via handles.            :
| `draggable`       | `boolean`               | Allows users to drag the       |
:                   :                         : entire circle.                 :
| `onRadiusChanged` | `(newRadius: number) => | Event handler fired when the   |
:                   : void`                   : radius is changed by the user. :
| `onCenterChanged` | `(latLng:               | Event handler fired when the   |
:                   : google.maps.LatLng) =>  : center is changed by the user. :
:                   : void`                   :                                :

```tsx
<Circle
  radius={radius}
  center={center}
  // Synchronization: Updates component state when user interacts
  onRadiusChanged={setRadius}
  onCenterChanged={changeCenter}
  // Styling
  strokeColor={'#0c4cb3'}
  fillColor={'#3b82f6'}
  fillOpacity={0.3}
  // Enable user manipulation
  editable
  draggable
/>
```

### 2.3. Draggable Marker

A standard `<Marker>` can also be made interactive. Dragging the marker updates
the geometry state (in this case, the `center` state used by the Circle).

```tsx
<Marker
  position={center}
  draggable
  onDrag={(e) =>
    setCenter({lat: e.latLng?.lat() ?? 0, lng: e.latLng?.lng() ?? 0})
  }
/>
```

## 3. Rendering Complex Static Geometry (Polygon and Polyline)

For large or complex geometric shapes, fetching and rendering a large array of
coordinate objects (`path`) can be resource-intensive. The best practice is to
use Google's Encoded Polyline Algorithm to compress the data payload.

The React components support the `encodedPath` (single geometry) or
`encodedPaths` (array of geometries) props, which accept standard encoded string
data.

### 3.1. Encoded Path Usage

Assume `POLYGONS` is an array of strings, where each string represents a
separate encoded path geometry.

| Component    | Prop           | Type       | Description     | Best Practice |
| :----------- | :------------- | :--------- | :-------------- | :------------ |
| `<Polygon>`  | `encodedPaths` | `string[]` | Renders         | Ideal for     |
:              :                :            : multiple        : rendering     :
:              :                :            : polygon shapes  : boundaries or :
:              :                :            : from an array   : large         :
:              :                :            : of encoded      : geo-datasets. :
:              :                :            : strings.        :               :
| `<Polyline>` | `encodedPath`  | `string`   | Renders a       | Efficiently   |
:              :                :            : single polyline : renders       :
:              :                :            : from an encoded : routes or     :
:              :                :            : string.         : complex       :
:              :                :            :                 : boundaries.   :

```tsx
// Example of how these components are used (assuming POLYGONS is imported)

const POLYGONS = [
  'y_pE~q|e[D]', // Example placeholder for an encoded path string
  // ... more strings
];

<Polygon strokeWeight={1.5} encodedPaths={POLYGONS} />

<Polyline
  strokeWeight={10}
  strokeColor={'#ff22cc88'}
  // Use a single element from the list of encoded strings
  encodedPath={POLYGONS[11]}
/>
```

### Best Practice: Data Payload Optimization

When dealing with static geometry, always prioritize encoded path strings
(`encodedPath`/`encodedPaths`) over raw coordinate arrays (`path`). Encoded
paths significantly reduce payload size and client-side processing required to
render the geometry. If you need interactive editing, you must use the `path`
array format, as encoded paths are read-only. For static display, stick to
encoded strings.
