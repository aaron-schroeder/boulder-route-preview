# boulder-route-preview

Build a route on a map of Boulder area trails by clicking on trail segments.
Click `Build Route` to create an elevation profile and statistics about the route.

Flask backend. React frontend.

## To run locally:

Use two terminal windows.

First window:

```sh
cd backend
python3 -m venv env
pip install -r requirements.txt
source env/bin/activate
python app.py
```

Second window:

```sh
cd frontend
npm install
npm start
```

## Current Progress

### To-do

- Deploy app on render.com!!

Bugs
- Black box appears around geojson features after clicking them.
  - Happens in edge/chrome, but not firefox.

Features
- Show an indication that the route is being built after user clicks
  `Build Route`
- Stats tab: show elevation loss too.
  (Not as much of an issue on round-trips)
- Find some way to use the same trail segment twice! ie an out-and-back or lollipop
  - This might be a big overhaul, because I currently am just keeping track of
    selected segments. This approach might require me to adopt the "mapmyrun"
    approach. Hmm. 
  - Maybe the profile could get built in real-time as they click
    segments, so that it doesn't have to infer everything at the end, making
    smarter inferences possible. 
  - Or we could have the segments populate a 
    list in order. Some way to just get an ordered list of trail segments,
    with the only remaining inference being the direction of each trailseg.
    That would also allow me to perform some kind of validation before each click.
    Like "hey, that segment is nowhere near the first one you clicked! NO!"
- [Huge, Potential] Add ability to save routes with names.

Data Processing
- Make decisions on which elevation profiles and grades to show
  (various sampling/smoothing approaches are displayed currently)
- See if it's possible/easy to add a histogram of grades like
  in the (currently evolving) `horsetooth-analysis`

Aesthetics
- Make `Build Route` and `Clear Selected Segments` buttons look pretty.
  They're just ugly unstyled placeholders thrown onto the page currently.
- Reduce route map height (xy plot is so low it's partially hidden)
- Selected segment list: brainstorm a better way to display other than
  a scrolly plain-text div.
- Elev profile: show elevation axis ticks on left side
- Replace react logo with TZ logo.
  - In `frontend/public`, modify the `.png`s, `favicon.ico`, and `manifest.json`
  - See `distilling-flask` repo for media
- Connect route markers with lines. 
  Maybe those lines can be color-coded by grade.
- Use [`flyToBounds`](https://leafletjs.com/reference.html#map-flytobounds)
  instead of `fitBounds` wherever it occurs.

Performance
- Use a smaller plotly.js bundle since I'm just doing cartesian:
  https://github.com/plotly/react-plotly.js/#customizing-the-plotlyjs-bundle

Requirements
- Update `elevation-query` GH repo w/ local changes, then change
  the source in `requirements.txt`.

Refactor
- Make a smarter way to control `getData()` source between
  local file in dev environment and `fetch` in production.
  - (later) employ similar strategy to control the url of the
    backend server. This will involve a whole thing with deployment.

### In-progress

Bugs

Features

Data Processing

Aesthetics

Refactor

### Complete

Bugs
- CircleMarkers have duplicate keys if they have the same lat.
  - Tests:
    - Build a route of Mount Sanitas Trail (had duplicate lat vals)
      -> no warning in console.
- Elevation profile doesn't re-draw when I already have drawn one.
  The stats tab actually DOES refresh though.

Features
- "Clear selected segments" button
  - Tests:
    - Add a bunch of segs, click clear -> segment list empty, map style reset.
    - Add a bunch of segs, navigate away, navigate back -> selected seg list 
      and selected segments on map preserved.
    - Add a bunch of segs, click clear, navigate away, navigate back ->
      selected seg list empty, no segments selected on map.
- Hover on map <-> hover on graph
  - [x] Make the leaflet map have hover behavior in the first place
    - Tests: 
      - hover over vertex -> tooltip appears at vertex
      - FAILING: (extra) hover over polyline line 
        -> tooltip appears at nearest vertex
        - Look into `this.mapRef.current.distance(latlng1, latlng2)`
  - [x] Hover on leaflet map -> hover on plotly graph
    - Tests:
      - hover over map point that contains a data point from xy graph
        -> that data point is highlighted on the xy graph
      - unhover that map point -> that xy data point is unhovered
      - unhover that map point and hover another point
        -> the first xy data point is unhovered, and the next xy point is hovered
      - FAILING: (extra) hover on all points that share an x-value with the
        elevation trace.
        - Bug: Only elevation trace is hovered, due to circular events (I think?)
        - Solution: instead of hovering by {curveNumber, pointNumber} to target
          the elevation trace, get the x-value of that point and manually hover
          at that location. I forget exactly how, but we'll find out in `Fx.hover`.
  - [x] Hover on plotly graph -> hover on leaflet map
    - [x] create an eventhandler for the Plot's elevation trace
      - Use `onHover` prop (don't wrap in `eventHandlers`):
        https://github.com/plotly/react-plotly.js/#event-handler-props
    - [x] Make the eventhandler force-hover the map based on the
          pointnumber
    - [x] create a complementary event for mouseout.
      - `onUnhover` in react-plotly world.

Data Processing

Aesthetics
- Make route-building tooltips on geojson sticky

Refactor
- Split tab content into separate components in their own files, imported by `App.js`
