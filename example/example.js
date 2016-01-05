import React from 'react';
import ReactDOM from 'react-dom';
import Hammer from 'hammerjs';
import Tabular from '../src/index.jsx';

class ExampleApp extends React.Component {
  getDataSource() {
    return require('json!./example-data.json');
  }
  render() {
    return (
      <Tabular getDataSource={this.getDataSource}
        tableHeight={1000}
        tableWidth={800}
        columns={[
          {
            title: 'first name',
            key: 'name.first',
            onClick: function () {
              alert('click');
            },
          },
          {
            title: 'last name',
            key: 'name.last'
          },
          {
            title: 'created',
            key: 'created',
            type: 'date'
          }
        ]}
      />
    );
  }
}

ReactDOM.render(<ExampleApp />, document.getElementById('root-container'));
