"use strict";
import 'fixed-data-table/dist/fixed-data-table.min.css'
import './index.css'

import React from 'react';
import ReactDOM from 'react-dom';
import Moment from 'moment';
import Hammer from 'hammerjs';
import {Table, Column, Cell} from 'fixed-data-table';

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};

function isTouchDevice() {
  return 'ontouchstart' in document// works on most browsers
      || 'ontouchstart' in document.documentElement
      || 'onmsgesturechange' in window; // works on ie10
}


function reverseSortDirection (sortDir) {
  return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
}

function getValueByNamespace (obj, namespace, type) {
  var curr = obj;
  var names = namespace.split('.');
  var key;
  do {
    key = names.shift();
    if (key) {
      curr = curr[key];
    }
  } 
  while (key && curr);
  if (type === 'date') {
    return Moment(curr).format('lll');
  } else if (type === 'bool') {
    return curr ? 'Yes' : 'No';
  } else {
    return curr;
  }
}

class SortHeaderCell extends React.Component {
  constructor(props) {
    super(props);
    this._onSortChange = this._onSortChange.bind(this);
  }
  render() {
    var {sortDir, children, ...props} = this.props;
    return (
      <Cell {...props}>
        <a onClick={this._onSortChange}>
          {children} {sortDir ? (sortDir === SortTypes.DESC ? '↓' : '↑') : ''}
        </a>
      </Cell>
    );
  }
  _onSortChange(e) {
    e.preventDefault();
    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.columnKey,
        this.props.sortDir ?
          reverseSortDirection(this.props.sortDir) :
          SortTypes.DESC
      );
    }
  }
}

const TextCell = ({rowIndex, data, columnKey, type, onClick, ...props}) => {
  const title = getValueByNamespace(data.getObjectAt(rowIndex), columnKey, type);
  if (typeof onClick === 'function') {
    return <Cell onClick={(e) => onClick(e, data.getObjectAt(rowIndex))} {...props}>{title}</Cell>;
  } else {
    return <Cell {...props}>{title}</Cell>;
  }
};

class DataListWrapper {
  constructor(indexMap, data) {
    this._indexMap = indexMap;
    this._data = data;
  }
  getSize() {
    return this._indexMap.length;
  }
  getObjectAt(index) {
    return this._data[
      this._indexMap[index]
    ];
  }
}

class Tabular extends React.Component {
  constructor(props) {
    super(props);
    this._mainKey = null;
    this._dataList = [];
    this._defaultSortIndexes = [];
    this._onSortChange = this._onSortChange.bind(this);
    this.state = {
      sortedDataList: new DataListWrapper(
        this._defaultSortIndexes,
        this._dataList
      ),
      colSortDirs: {},
      top: 0,
      left: 0,
      scrollTop: 0,
      scrollLeft: 0,
      maxScrollY: this.props.tableHeight,
      maxScrollX: this.props.tableWidth,
    };
  }

  _getScrollHanle(topProps, leftProps) {
    return function(ev) {
      var scrollTop = this.state.top - ev.deltaY;
      if (scrollTop <= 0) {
        this.setState({[topProps]: 0});
      } else if (scrollTop >= this.state.maxScrollY) {
        this.setState({[topProps]: this.state.maxScrollY});
      } else {
        this.setState({[topProps]: scrollTop});
      }
    }
  }

  async componentDidMount() {
    if (typeof this.props.getDataSource === 'function') {
      this._dataList = await this.props.getDataSource();
      this._index.call(this);
      this.setState({
        sortedDataList: new DataListWrapper(this._defaultSortIndexes, this._dataList),
      });
    }

    var table = ReactDOM.findDOMNode(this.refs.table);
    var hammer = new Hammer.Manager(table, {
      recognizers: [
        [Hammer.Pan, {threshold: 0}],
        [Hammer.Swipe, ['pan']]
      ]
    });
    hammer.on('swipe pan', this._getScrollHanle('scrollTop', 'scrollLeft').bind(this));
    hammer.on('panend', this._getScrollHanle('top', 'left').bind(this));
  }

  filter(input) {
    const list = this._dataList;
    const filteredIndexes = [];
    const filterProperty = this._mainKey || this.props.columns[0].key;
    for (let index = 0; index < list.length; index++) {
      let key = getValueByNamespace(this._dataList[index], filterProperty);
      if (key.toLowerCase().indexOf(input) !== -1) {
        filteredIndexes.push(index);
      }
    }
    this.setState({
      sortedDataList: new DataListWrapper(filteredIndexes, this._dataList),
    });
  }
  _index() {
    var size = this._dataList.length;
    for (let index = 0; index < size; index++) {
      this._defaultSortIndexes.push(index);
    }
  }

  _onSortChange(columnKey, sortDir) {
    // set mainKey firstly
    this._mainKey = columnKey;
    // start sorting
    var sortIndexes = this._defaultSortIndexes.slice();
    sortIndexes.sort((indexA, indexB) => {
      var valueA = getValueByNamespace(this._dataList[indexA], columnKey);
      var valueB = getValueByNamespace(this._dataList[indexB], columnKey);
      var sortVal = 0;
      if (valueA > valueB) {
        sortVal = 1;
      }
      if (valueA < valueB) {
        sortVal = -1;
      }
      if (sortVal !== 0 && sortDir === SortTypes.ASC) {
        sortVal = sortVal * -1;
      }
      return sortVal;
    });
    this.setState({
      sortedDataList: new DataListWrapper(sortIndexes, this._dataList),
      colSortDirs: {
        [columnKey]: sortDir,
      }
    });
  }

  _onContentHeightChange(contentHeight) {
    this.setState({maxScrollY: contentHeight - this.props.tableHeight});
  }

  renderColumn(data) {
    const width = this.props.tableWidth;
    const columnsCount = this.props.columns.length;
    return (
      <Column
        key={data.key}
        columnKey={data.key}
        header={
          <SortHeaderCell
            onSortChange={this._onSortChange}
            sortDir={this.state.colSortDirs[data.key]}>
            {data.title}
          </SortHeaderCell>
        }
        cell={(
          <TextCell data={this.state.sortedDataList}
            type={data.type}
            onClick={data.onClick} />
        )}
        width={1.0/columnsCount*width}
      />
    );
  }

  render() {
    var table = (
      <Table
        ref='table'
        rowHeight={50}
        rowsCount={this.state.sortedDataList.getSize()}
        headerHeight={50}
        height={this.props.tableHeight}
        width={this.props.tableWidth}>
        {this.props.columns.map(this.renderColumn.bind(this))}
      </Table>);


    if (!isTouchDevice()) {
      return React.cloneElement(table, {
        overflowY: 'auto',
        overflowX: 'auto',
      });
    } else {
      return React.cloneElement(table, {
        onContentHeightChange: this._onContentHeightChange.bind(this),
        overflowY: 'hidden',
        overflowX: 'hidden',
        scrollTop: this.state.scrollTop,
        scrollLeft: this.state.scrollLeft,
      });
    }
  }
}

module.exports = Tabular;
