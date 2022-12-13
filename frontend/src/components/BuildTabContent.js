import { Component, createRef } from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'


class BuildTabContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: JSON.parse(window.localStorage.getItem('selected')) || [],
      trailData: null,
    }

    this.mapRef = createRef();
    this.geojsonRef = createRef();
    
    this.getData = this.getData.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.handleSegClick = this.handleSegClick.bind(this);
    this.handleClearClick = this.handleClearClick.bind(this);
    this.styleGeojson = this.styleGeojson.bind(this);
    this.getGeojsonFeature = this.getGeojsonFeature.bind(this);
  }

  componentDidMount() {
    // I'll see this getting called twice, but only in dev.
    this.getData()
      .then(geojsonData => {
        this.setState({trailData: geojsonData})
      })
  }

  setState(state, callback) {
    if (state.hasOwnProperty('selected')) {
      window.localStorage.setItem('selected', JSON.stringify(state.selected));
    };
    super.setState(state, callback);
  }

  async getData() {
    // Development only, for speed.
    return import('../data/all_osmp_trails.json')

    // return fetch('http://localhost:5000/trails', {
    //   methods: 'GET',
    //   headers: {
    //     'Content-Type':'application/json'
    //   }
    // })
    // .then(response => response.json())
  }

  isSelected(feature) {
    // needs modified probably
    return this.state.selected.indexOf(feature.properties['GISPROD3.OSMP.TrailsOSMP.SEGMENTID']) > -1
  }

  handleSegClick(feature) {
    const newArray = new Array(...this.state.selected);
    const segId = feature.properties['GISPROD3.OSMP.TrailsOSMP.SEGMENTID'];
    const index = this.state.selected.indexOf(segId);
    if (index > -1) {
      newArray.splice(index, 1);
    } else {
      newArray.push(segId);
    }
    this.setState({selected: newArray});
  }

  styleGeojson(feature) {
    if (
      typeof feature !== 'undefined'
      && feature !== null
      && this.isSelected(feature)
    ){
      return {color: '#4B1BDE'}
    }
  };

  getGeojsonFeature(segId) {
    for (var i = 0; i < this.state.trailData.features.length; i++) {
      let feature = this.state.trailData.features[i];
      if (feature.properties['GISPROD3.OSMP.TrailsOSMP.SEGMENTID'] === segId){
        return feature
      }
    }
  }

  async handleSubmitClick() {
    const features = this.state.selected
      .map(segId => this.getGeojsonFeature(segId));
    this.props.onsubmit(features);
  }

  handleClearClick() {
    this.setState({selected: []}, () => {
      this.geojsonRef.current.resetStyle()
    });
    this.props.onclear()
  }

  render() {
    return (
      <div>
        <MapContainer
          key='mymap'
          center={[40.013970, -105.252197]}
          zoom={17}
          ref={this.mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {
            this.state.trailData !== null &&
            <GeoJSON 
              key='whatever'
              data={this.state.trailData}
              attribution='City of Boulder OSMP'
              ref={this.geojsonRef}
              style={this.styleGeojson}
              eventHandlers={{
                add: () => {
                  console.log('geojson loaded');  // debug
                  this.mapRef.current.fitBounds(this.geojsonRef.current.getBounds())
                },
              }}
              onEachFeature={(feature, layer) => {
                // const segId = feature.properties['GISPROD3.OSMP.TrailsOSMP.SEGMENTID'];
                const trailName = feature.properties['GISPROD3.OSMP.TrailsOSMP.TRAILNAME']
                layer.on({
                  'mouseover': (e) => {
                    const tooltip = this.isSelected(feature) ? trailName + '<br>Selected' : trailName;
                    layer.bindTooltip(tooltip, {sticky: true});
                    // layer.openTooltip(e.latlng);
                    layer.openTooltip();
                    layer.setStyle({
                      weight: 7,
                      color: 'red',
                    });
                  },
                  'mouseout': (e) => {
                    layer.unbindTooltip();
                    layer.closeTooltip();
                    this.geojsonRef.current.resetStyle(e.target);
                  },
                  'click': (e) => {
                    this.handleSegClick(feature);
                  },
                });
              }}
            />
          }

        </MapContainer>
        <Row className='justify-contents-between'>
          {
            this.state.trailData === null &&
            <div id='loading'>Retrieving geoJSON trail data...</div> 
          }
          {
            this.state.trailData !== null &&
            <Col sm={12} md={9} id='selected'>
              <div>
                Selected trail segments:
                <ul>
                  {this.state.selected.map(function(segId, index) {
                    let feature = this.getGeojsonFeature(segId);
                    return <li key={index}>{segId} ({feature.properties['GISPROD3.OSMP.TrailsOSMP.TRAILNAME']})</li>;
                  }.bind(this))}
                </ul>
              </div>
            </Col>
          }
          {
            this.state.selected !== null && this.state.selected.length > 0 && this.state.trailData !== null &&
            <Col sm={12} md={3} className='d-flex align-items-start justify-content-center justify-content-md-end'>
              <Button onClick={this.handleSubmitClick.bind(this)}>Build Route</Button>
              <Button onClick={this.handleClearClick.bind(this)}>Clear Selected Segments</Button>
            </Col>
          }
        </Row>
      </div>
    )
  }
}

export default BuildTabContent