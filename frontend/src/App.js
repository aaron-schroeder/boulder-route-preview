import {Component} from 'react'
import Container from 'react-bootstrap/Container';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import './App.css';
import BuildTabContent from './components/BuildTabContent'
import RouteTabContent from './components/RouteTabContent'
import StatsTable from './components/StatsTable'


class App extends Component {
  constructor(props) {
    super(props);

    // Temp: reset cookies
    // window.localStorage.removeItem('selected');

    this.state = {
      key: 'build',
      routeFeature: null,
      figData: null,
      figLayout: null,
      stats: null,
      routeBuilt: false,
    }
  }

  async handleSubmitClick(features) {
    // console.log(features);

    // const response = await fetch('http://localhost:5000/create_route', {
    fetch('http://localhost:5000/create_route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // mode: 'no-cors',
      mode: 'cors',
      // redirect: 'follow',
      body: JSON.stringify(features)
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          key: 'profile',
          routeBuilt: true,
          routeFeature: data['route'],
          figData: data['data'],
          figLayout: data['layout'],
          stats: data['stats'],
        });
      })
  }

  render() {
    return (
      <Container>
        <Tabs
          activeKey={this.state.key}
          onSelect={(k) => this.setState({key: k})}
          transition={false}
        >
          <Tab eventKey='build' title='Build Route'>
            <BuildTabContent
              ref={this.buildTabRef}
              onsubmit={this.handleSubmitClick.bind(this)}
              onclear={()=>this.setState({routeBuilt: false})}
            />
          </Tab>
          {
            this.state.routeBuilt &&
            <Tab eventKey='profile' title='Elevation Profile' >
              <RouteTabContent
                routefeature={this.state.routeFeature}
                plotdata={this.state.figData}
                plotlayout={this.state.figLayout}
              />
            </Tab>
          }
          {
            this.state.routeBuilt &&
            <Tab eventKey='stats' title='Stats'>
              <StatsTable
                stats={this.state.stats}
              />
            </Tab>
          }
        </Tabs>
      </Container>
    );
  }
}

export default App;
