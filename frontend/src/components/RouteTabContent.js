import { Component, createRef } from 'react'
import { MapContainer, TileLayer, Tooltip, CircleMarker, FeatureGroup } from 'react-leaflet'
import Plot from 'react-plotly.js'
// import Plotly from 'plotly.js-dist'
import {Fx} from 'plotly.js-dist';


class RouteTabContent extends Component {
  constructor(props) {
    super(props);

    this.mapRef = createRef();
    this.featureGroupRef = createRef();
    this.plotRef = createRef();
  }

  render() {
    return (
      <div>
        <MapContainer
          key='dtl'
          center={[40.013970, -105.252197]}
          zoom={17}
          ref={this.mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <FeatureGroup 
            ref={this.featureGroupRef}
            eventHandlers={{
              add: () => {
                this.mapRef.current.fitBounds(this.featureGroupRef.current.getBounds())
              },
            }}
          >
            {this.props.routefeature.coordinates.map((lonlat, index)=>
              <CircleMarker 
                center={lonlat.slice().reverse()} 
                radius={2} 
                key={index}
                pointnumber={index}
                eventHandlers={{
                  mouseover: (e) => {
                    const marker = e.target;
                    // console.log(marker);  // CircleMarker

                    // Programmatically force hover event. Since we are doing it
                    // by pointNumber, we have to specify each curveNumber separately.                  
                    Fx.hover(
                      this.plotRef.current.el,
                      [{curveNumber: 0, pointNumber: marker.options.pointnumber}]
                    )
                  },
                  mouseout: () => Fx.hover(this.plotRef.current.el, [])
                }}
              >
                <Tooltip>{lonlat}</Tooltip>
              </CircleMarker>
            )}
          </FeatureGroup>
        </MapContainer>
        <Plot
          data={this.props.plotdata}
          layout={this.props.plotlayout}
          // layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
          config={{responsive: true}}
          style={{width: '100%', height: '100%'}}
          ref={this.plotRef}
          onHover={(hoverData) => {
            if (hoverData && hoverData.points) {
              const traceNames = hoverData.points.map((point) => point.data.name)
              const elevationTraceNumber = traceNames.indexOf('elevation')
              if (elevationTraceNumber === -1) {
                return
              }
              const plotPointNumber = hoverData.points[elevationTraceNumber].pointNumber;
              // get the `leaflet.Map` element
              // https://leafletjs.com/reference.html#map
              const map = this.mapRef.current;
              map.eachLayer((layer) => {
                const mapPointNumber = layer.options.pointnumber
                if (mapPointNumber !== undefined && mapPointNumber === plotPointNumber) {
                  // We have found the marker on the map that corresponds to
                  // the hovered point on the elevation trace.
                  layer.fire('mouseover');
                }
              })
            }
          }}
          onUnhover={(hoverData) => {
            const map = this.mapRef.current;
            // maybe lazy, but it gets the job done w/o issue.
            map.eachLayer((layer) => {
              layer.fire('mouseout');
            })
          }}
        />
      </div>
    )
  }
}

export default RouteTabContent