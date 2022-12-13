import Table from 'react-bootstrap/Table';


function StatsTable(props) {

  const {stats} = props;

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Stat</th>
          <th>Method</th>
          <th>Distance Sampling</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Distance</td>
          <td>Standard</td>
          <td>Standard</td>
          <td>{stats.distance}</td>
        </tr>
        <tr>
          <td>Gain</td>
          <td>Net</td>
          <td>Standard</td>
          <td>{stats.gain.net}</td>
        </tr>
        <tr>
          <td>Gain</td>
          <td>Naive</td>
          <td>Standard</td>
          <td>{stats.gain.naive}</td>
        </tr>
        <tr>
          <td>Gain</td>
          <td>5' Threshold</td>
          <td>Standard</td>
          <td>{stats.gain.threshold}</td>
        </tr>
        <tr>
          <td>Gain</td>
          <td>Naive</td>
          <td>5m</td>
          <td>{stats.gain.naive_5m}</td>
        </tr>
        <tr>
          <td>Gain</td>
          <td>Naive</td>
          <td>2m</td>
          <td>{stats.gain.naive_2m}</td>
        </tr>
      </tbody>
    </Table>
  )
}

export default StatsTable