
# React Touchable Tabular

A React Component to used to view tabular data based on [facebook/fixed-data-table](https://github.com/facebook/fixed-data-table).

## Installation

```sh
$ npm install react-touchable-tabular --save
```

## Usage

```js
const React = require('react');
const Tabular = require('react-touchable-tabular');

class ExampleApp extends React.Component {
  async getDataSource() {
    return await getList();
  }
  render() {
    return (
      <SortedTable getDataSource={this.getDataSource}
        tableHeight={1000}
        tableWidth={800}
        columns={[
          {
            title: 'first name',
            key: 'name.first'
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
```

## Why not fixed-data-table directly?

We build the following features based on `fixed-data-table`:

- provides touchable to view your data on iPad, Android Pad devices
- provides sortable column by default and supports dot namespace for sorting key
- provides an array property `columns` to render your column data with less code
- provides a property `type`
  - if `type` is "date", this component will format the date by using `momentjs`
  - if `type` is "bool", this component will format the value to `Yes` or `No`
- with auto computation on the width values of every columns based on the total width.

## License

MIT