'use strict';
const React = require('react');
const Moment = require('moment');
const {
  Scroller
} = require('scroller');
const { 
  Table, 
  Column, 
  Cell
} = require('fixed-data-table');

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};

function isTouchDevice() {
  return 'ontouchstart' in document.documentElement // works on most browsers
      || 'onmsgesturechange' in window; // works on ie10
}

class TouchableArea extends React.Component {
  static propTypes = { 
    touchable: React.PropTypes.bool,
  };
  static defaultProps = {
    touchable: true,
  };
  handleTouchStart(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }
    this.props.scroller.doTouchStart(e.touches, e.timeStamp);
    e.preventDefault();
  }
  handleTouchMove(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }
    this.props.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    e.preventDefault();
  }
  handleTouchEnd(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }
    this.props.scroller.doTouchEnd(e.timeStamp);
    e.preventDefault();
  }
  render() {
    var styles = {
      touchable: {
        position: 'absolute',
        top: 50,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
      }
    };
    return (
      <div>
        <div style={styles.touchable}
          onTouchStart={this.handleTouchStart.bind(this)}
          onTouchMove={this.handleTouchMove.bind(this)}
          onTouchEnd={this.handleTouchEnd.bind(this)}
          onTouchCancel={this.handleTouchEnd.bind(this)}
        ></div>
        {this.props.children}
      </div>
    );
  }
}

class TouchableWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: 0,
      top: 100,
      contentHeight: 0,
      contentWidth: 0,
    };
  }
  componentWillMount() {
    this.scroller = new Scroller(this._handleScroll.bind(this));
  }
  render() {
    if (!isTouchDevice()) {
      return React.cloneElement(this.props.children, {
        tableHeight: this.props.tableHeight,
        tableWidth: this.props.tableWidth
      });
    }
    var controlledScrolling = this.state.left !== undefined || 
      this.state.top !== undefined;
    var children = React.cloneElement(this.props.children, {
      onContentDimensionsChange: this._onContentDimensionsChange.bind(this),
      scrollTop: this.state.top,
      scrollLeft: this.state.left,
      tableHeight: this.props.tableHeight,
      tableWidth: this.props.tableWidth,
      overflowX: controlledScrolling ? 'hidden' : 'auto',
      overflowY: controlledScrolling ? 'hidden' : 'auto',
    });
    return (
      <TouchableArea scroller={this.scroller}>
        {children}
      </TouchableArea>
    );
  }
  _onContentDimensionsChange(contentHeight, contentWidth) {
    this.scroller.setDimensions(
      this.props.tableWidth,
      this.props.tableHeight,
      contentWidth,
      contentHeight
    );
  }
  _handleScroll(left, top) {
    this.setState({
      left: left,
      top: top
    });
  }
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
    return Moment(curr).fromNow();
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

const TextCell = ({rowIndex, data, columnKey, type, ...props}) => (
  <Cell {...props}>
    {getValueByNamespace(
      data.getObjectAt(rowIndex),
      columnKey,
      type
    )}
  </Cell>
);

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

class SortedTable extends React.Component {
  constructor(props) {
    super(props);
    this._dataList = [];
    this._defaultSortIndexes = [];
    this._onSortChange = this._onSortChange.bind(this);
    this.state = {
      sortedDataList: new DataListWrapper([], []),
      colSortDirs: {},
    };
  }
  async componentDidMount() {
    if (typeof this.props.getDataSource === 'function') {
      this._dataList = await this.props.getDataSource();
      this._index.call(this);
      this.setState({
        sortedDataList: new DataListWrapper(this._defaultSortIndexes, this._dataList),
      });
    }
  }
  _index() {
    var size = this._dataList.length;
    for (let index = 0; index < size; index++) {
      this._defaultSortIndexes.push(index);
    }
  }
  _onSortChange(columnKey, sortDir) {
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
    this.onContentDimensionsChange &&
      this.onContentDimensionsChange(
        contentHeight,
        Math.max(600, this.tableWidth)
      );
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
        cell={<TextCell data={this.state.sortedDataList} type={data.type} />}
        width={1.0/columnsCount*width}
      />
    );
  }
  render() {
    return (
      <TouchableWrapper {...this.props}>
        <Table
          rowHeight={50}
          rowsCount={this.state.sortedDataList.getSize()}
          headerHeight={50}
          height={this.props.tableHeight}
          width={this.props.tableWidth}
          onContentHeightChange={this._onContentHeightChange}>
          {this.props.columns.map(this.renderColumn.bind(this))}
        </Table>
      </TouchableWrapper>
    );
  }
}

module.exports = SortedTable;
