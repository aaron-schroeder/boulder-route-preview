function forceHover(hoverData) {
  var myPlot = document.getElementById('{0}')
  if (!myPlot.children[1]) {
    return window.dash_clientside.no_update
  }
  myPlot.children[1].id = '{0}_js'

  if (hoverData) {
    // Catch hover events where we have map data that doesn't share
    // the same number of records as our DataFrame. (Relic)
    // if (hoverData.points[0].curveNumber > 1) {
    //   console.log('No hover');
    //   return window.dash_clientside.no_update
    // }
    
    var ix = hoverData.points[0].pointIndex

    // Programmatically force hover event. Since we are doing it
    // by pointNumber, we have to specify each curveNumber separately.
    var evt = [];
    for (var i = 0; i < 10; i++) {
      evt.push({curveNumber: i, pointNumber: ix});
    }
    
    Plotly.Fx.hover(
      '{0}_js',
      evt,
      '{2}'  // 'mapbox' makes Scattermapbox hovering work
    )

    // Note: Could this script become general by receiving 
    // two inputs? 
    // 1) id of the dcc.Graph (map, elevation, speed)
    // 2) name of the subplot that needs to be hovered
    //    (mapbox, xy, xy2, xy3, etc)
    // Not sure, as the xy hovering works because of the
    // shared hovering. To do curvenumber, I'd need to select
    // each trace's point individually.
    // Hm. I think I will try this out AFTER this commit, when I
    // Play around with multiple traces on the map.
    // Could change the map's hovering to select
    // all nearby points when one pointNumber is selected.
    // Possible?
    //
    // Thought some more, and realized I will want special hovering
    // from one map trace to another - if I map-match, I'll want to
    // show the matched point that corresponds to the hovered point.
    // And that might not be close. So I think hovering a point on
    // the map might need to be its own script (not combined with
    // this script.)

  }
}