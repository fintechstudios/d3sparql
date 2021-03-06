//
// d3sparql.js - utilities for visualizing SPARQL results with the D3 library
//
//   Web site: http://github.com/ktym/d3sparql/
//   Copyright: 2013-2015 (C) Toshiaki Katayama (ktym@dbcls.jp)
//   License: BSD license (same as D3.js)
//   Initial version: 2013-01-28
//

import d3 from 'd3';
import 'd3-sankey';
import * as topojson from 'topojson-client';

const d3sparql = {
  version: 'd3sparql.js version 2020-04-25',
  debug: false  // set to true for showing debug information
};

export default d3sparql;


function debugEnabled() {
  return d3sparql.debug;
}

/**
 * @param {...*} messages
 */
function debug(...messages) {
  if (debugEnabled()) {
    console.debug(...messages);
  }
}

/**
 * Utlity method for
 * @param {SparqlResultBinding[]} bindings
 * @param {string[]} vars
 * @return {SparqlResults}
 */
d3sparql.createResults = function(bindings, { vars = Object.keys(bindings[0])} = {}) {
  return {
    head: {
      vars,
    },
    results: {
      bindings,
    }
  }
}

/**
 * Execute a SPARQL query
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<SparqlResults>}
 */
d3sparql.fetch = async (url, init = {}) => {
  debug(url, init);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Accept: 'application/sparql-results+json',
    }
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

/**
 * @param {string} endpoint
 * @param {string} sparql
 * @param {('GET'|'POST')} [type]
 * @returns {Promise<SparqlResults>}
 */
d3sparql.query = function (endpoint, sparql, type = 'GET') {
  const url = new URL(endpoint);
  if (type === 'GET') {
    url.search = `query=${encodeURIComponent(sparql)}`;
    return d3sparql.fetch(url.href);
  } else if (type === 'POST') {
    // encode query as Form data
    const formData = new FormData();
    formData.append('query', sparql);
    // encode Form data to x-www-form-urlencoded
    const body = new URLSearchParams([...formData.entries()]);
    return d3sparql.fetch(url.href, {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
  }

  throw new TypeError(`unsupported query type: ${type}`);
};


/*
  Convert sparql-results+json object into a JSON graph in the {"nodes": [], "links": []} form.
  Suitable for d3.layout.force(), d3.layout.sankey() etc.

  Options:
    config = {
      "key1":   "node1",       // SPARQL letiable name for node1 (optional; default is the 1st letiable)
      "key2":   "node2",       // SPARQL letiable name for node2 (optional; default is the 2nd letibale)
      "label1": "node1label",  // SPARQL letiable name for the label of node1 (optional; default is the 3rd letiable)
      "label2": "node2label",  // SPARQL letiable name for the label of node2 (optional; default is the 4th letiable)
      "value1": "node1value",  // SPARQL letiable name for the value of node1 (optional; default is the 5th letiable)
      "value2": "node2value"   // SPARQL letiable name for the value of node2 (optional; default is the 6th letiable)
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.forcegraph(json, config)
      d3sparql.sankey(json, config)
    }

  TODO:
    Should follow the convention in the miserables.json https://gist.github.com/mbostock/4062045 to contain group for nodes and value for edges.
*/
/**
 *
 * @param {SparqlResults} json
 * @param {GraphConfig} [config = {}]
 * @return {{nodes: [], links: []}}
 */
d3sparql.graph = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let key1 = config.key1 || head[0] || 'key1';
  let key2 = config.key2 || head[1] || 'key2';
  let label1 = config.label1 || head[2] || false;
  let label2 = config.label2 || head[3] || false;
  let value1 = config.value1 || head[4] || false;
  let value2 = config.value2 || head[5] || false;

  let graph = {
    'nodes': [],
    'links': []
  };
  let valueToIndexMap = new Map();
  let index = 0;
  for (let i = 0; i < data.length; i++) {
    let datum = data[i];
    let key1Val = datum[key1].value;
    let key2Val = datum[key2].value;
    let label1Val = label1 ? datum[label1].value : key1Val;
    let label2Val = label2 ? datum[label2].value : key2Val;
    let value1Val = value1 ? datum[value1].value : false;
    let value2Val = value2 ? datum[value2].value : false;
    if (!valueToIndexMap.has(key1Val)) {
      graph.nodes.push({ 'key': key1Val, 'label': label1Val, 'value': value1Val });
      valueToIndexMap.set(key1Val, index);
      index++;
    }
    if (!valueToIndexMap.has(key2Val)) {
      graph.nodes.push({ 'key': key2Val, 'label': label2Val, 'value': value2Val });
      valueToIndexMap.set(key2Val, index);
      index++;
    }
    graph.links.push({ 'source': valueToIndexMap.get(key1Val), 'target': valueToIndexMap.get(key2Val) });
  }
  debug(graph);
  return graph;
};

/*
  Convert sparql-results+json object into a JSON tree of {"name": name, "value": size, "children": []} format like in the flare.json file.

  Suitable for d3.layout.hierarchy() family
    * cluster:    d3sparql.dendrogram()
    * pack:       d3sparql.circlepack()
    * partition:  d3sparql.sunburst()
    * tree:       d3sparql.roundtree()
    * treemap:    d3sparql.treemap(), d3sparql.treemapzoom()

  Options:
    config = {
      "root":   "root_name",    // SPARQL letiable name for root node (optional; default is the 1st letiable)
      "parent": "parent_name",  // SPARQL letiable name for parent node (optional; default is the 2nd letiable)
      "child":  "child_name",   // SPARQL letiable name for child node (ptional; default is the 3rd letiable)
      "value":  "value_name"    // SPARQL letiable name for numerical value of the child node (optional; default is the 4th letiable or "value")
    }

  Synopsis:
    d3sparql.sparql(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.roundtree(json, config)
      d3sparql.dendrogram(json, config)
      d3sparql.sunburst(json, config)
      d3sparql.treemap(json, config)
      d3sparql.treemapzoom(json, config)
    }
*/
/**
 *
 * @param {SparqlResults} json
 * @param {TreeConfig} [config={}]
 * @return {Tree}
 */
d3sparql.tree = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let rootKey = config.root || head[0];
  let parentKey = config.parent || head[1];
  let childKey = config.child || head[2];
  let valueKey = config.value || head[3] || 'value';

  /**
   * Maps parents to a list of children.
   *
   * @type {Map<string, string[]>}
   */
  let hierarchyMap = new Map();
  /**
   * Maps child to values.
   * @type {Map<string, number|string>}
   */
  let valueMap = new Map();

  // Build memoized access maps
  for (let i = 0; i < data.length; i++) {
    const datum = data[i];
    let parent = datum[parentKey].value;
    let child = datum[childKey].value;
    if (parent !== child) {
      /** @type {string[]} */
      let children;
      if (hierarchyMap.has(parent)) {
        children = hierarchyMap.get(parent);
        children.push(child);
      } else {
        children = [child];
      }
      hierarchyMap.set(parent, children);
      if (datum[valueKey]) {
        valueMap.set(child, datum[valueKey].value);
      }
    }
  }

  debug("Tree memoization");
  debug("pair map", hierarchyMap);
  debug("size map", valueMap);

  /**
   * @param {string} nodeName
   * @return {TreeNode}
   */
  let traverse = (nodeName) => {
    let list = hierarchyMap.get(nodeName);
    debug("Traversing", nodeName, list);
    if (!list) {
      return { 'name': nodeName, 'value': valueMap.get(nodeName) || 1, children: [] };
    }
    let children = list.map((d) => traverse(d));
    // sum of values of children
    let subtotal = d3.sum(children, (d) => d.value);
    // add a value of parent if exists
    let total = d3.sum([subtotal, valueMap.get(nodeName)]);
    return { children, 'name': nodeName, 'value': total };
  };

  let root = data[0][rootKey].value;
  debug("Root", root);
  let tree = traverse(root);

  debug(tree);
  return tree;
};

/*
  Rendering sparql-results+json object containing multiple rows into a HTML table

  Options:
    config = {
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.htmltable(json, config)
    }

  CSS:
    <style>
    table {
      margin: 10px;
    }
    th {
      background: #eeeeee;
    }
    th:first-letter {
       text-transform: capitalize;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {HTMLTableConfig} [config={}]
 */
d3sparql.htmltable = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let columns = config.columns || head;
  let headers = config.headers || columns;
  let selector = config.selector || null;
  let limit = config.limit !== undefined ? config.limit : data.length;
  let offset = config.offset !== undefined ? config.offset : 0;

  data = data.slice(offset, offset + limit);

  let table = d3sparql
    .select(selector, 'htmltable')
    .append('table')
    .attr('class', 'table table-bordered');

  debug('Table');
  debug(table);
  let thead = table.append('thead');
  let tbody = table.append('tbody');
  thead.append('tr')
    .selectAll('th')
    .data(headers)
    .enter()
    .append('th')
    .text((col) => col);
  let rows = tbody.selectAll('tr')
    .data(data)
    .enter()
    .append('tr');
  let cells = rows.selectAll('td')
    .data((row) => columns.map((col) => row[col] ? row[col].value : ''))
    .enter()
    .append('td')
    .text((val) => val);

  debug('Table cells');
  debug(cells);

  // default CSS
  table.style({
    'margin': '10px'
  });
  table.selectAll('th').style({
    'background': '#eeeeee',
    'text-transform': 'capitalize',
  });
};

/*
  Rendering sparql-results+json object containing one row into a HTML table

  Options:
    config = {
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.htmlhash(json, config)
    }

  CSS:
    <style>
    table {
      margin: 10px;
    }
    th {
      background: #eeeeee;
    }
    th:first-letter {
       text-transform: capitalize;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {HTMLHashConfig} [config={}]
 */
d3sparql.htmlhash = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings[0];

  let selector = config.selector || null;

  let table = d3sparql
    .select(selector, 'htmlhash')
    .append('table')
    .attr('class', 'table table-bordered');

  let tbody = table.append('tbody');
  let row = tbody.selectAll('tr')
    .data(() => head.map((col) => ({ head: col, data: data[col] ? data[col].value : '' })))
    .enter()
    .append('tr');
  row.append('th')
    .text((d) => d.head);
  row.append('td')
    .text((d) => d.data);

  // default CSS
  table.style({
    'margin': '10px'
  });
  table.selectAll('th').style({
    'background': '#eeeeee',
    'text-transform': 'capitalize',
  });
};

/*
  Rendering sparql-results+json object into a bar chart

  References:
    http://bl.ocks.org/mbostock/3885304
    http://bl.ocks.org/mbostock/4403522

  Options:
    config = {
      "label_x":  "Prefecture",  // label for x-axis (optional; default is same as let_x)
      "label_y":  "Area",        // label for y-axis (optional; default is same as let_y)
      "let_x":    "pref",        // SPARQL letiable name for x-axis (optional; default is the 1st letiable)
      "let_y":    "area",        // SPARQL letiable name for y-axis (optional; default is the 2nd letiable)
      "width":    850,           // canvas width (optional)
      "height":   300,           // canvas height (optional)
      "margin":   40,            // canvas margin (optional)
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.barchart(json, config)
    }

  CSS/SVG:
    <style>
    .bar {
      fill: steelblue;
    }
    .bar:hover {
      fill: brown;
    }
    .axis {
      font: 10px sans-serif;
    }
    .axis path,
    .axis line {
      fill: none;
      stroke: #000000;
      shape-rendering: crispEdges;
    }
    .x.axis path {
      display: none;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {BarChartConfig} [config={}]
 */
d3sparql.barchart = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let label_x = config.label_x || head[0];
  let label_y = config.label_y || head[1];
  let let_x = config.let_x || head[0];
  let let_y = config.let_y || head[1];
  let width = config.width || 750;
  let height = config.height || 300;
  let margin = config.margin || 80;   // TODO: to make use of {top: 10; right: 10; bottom: 80; left: 80}
  let selector = config.selector || null;

  let scale_x = d3.scale.ordinal().rangeRoundBands([0, width - margin], 0.1);
  let scale_y = d3.scale.linear().range([height - margin, 0]);
  let axis_x = d3.svg.axis().scale(scale_x).orient('bottom');
  let axis_y = d3.svg.axis().scale(scale_y).orient('left');  // .ticks(10, "%")
  scale_x.domain(data.map((d) => d[let_x].value));
  scale_y.domain(d3.extent(data, (d) => parseInt(d[let_y].value)));

  let svg = d3sparql.select(selector, 'barchart').append('svg')
    .attr('width', width)
    .attr('height', height);
//    .append("g")
//    .attr("transform", "translate(" + margin + "," + 0 + ")")

  let ax = svg.append('g')
    .attr('class', 'axis x')
    .attr('transform', 'translate(' + margin + ',' + (height - margin) + ')')
    .call(axis_x);

  let ay = svg.append('g')
    .attr('class', 'axis y')
    .attr('transform', 'translate(' + margin + ',0)')
    .call(axis_y);

  let bar = svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('transform', 'translate(' + margin + ',' + 0 + ')')
    .attr('class', 'bar')
    .attr('x', (d) => scale_x(d[let_x].value))
    .attr('width', scale_x.rangeBand())
    .attr('y', (d) => scale_y(d[let_y].value))
    .attr('height', (d) => height - scale_y(parseInt(d[let_y].value)) - margin);

  ax.selectAll('text')
    .attr('dy', '.35em')
    .attr('x', 10)
    .attr('y', 0)
    .attr('transform', 'rotate(90)')
    .style('text-anchor', 'start');
  ax.append('text')
    .attr('class', 'label')
    .text(label_x)
    .style('text-anchor', 'middle')
    .attr('transform', 'translate(' + ((width - margin) / 2) + ',' + (margin - 5) + ')');
  ay.append('text')
    .attr('class', 'label')
    .text(label_y)
    .style('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0 - (height / 2))
    .attr('y', 0 - (margin - 20));

  // default CSS/SVG
  bar.attr({
    'fill': 'steelblue',
  });
  svg.selectAll('.axis').attr({
    'stroke': 'black',
    'fill': 'none',
    'shape-rendering': 'crispEdges',
  });
  svg.selectAll('text').attr({
    'stroke': 'none',
    'fill': 'black',
    'font-size': '8pt',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a pie chart

  References:
    http://bl.ocks.org/mbostock/3887235 Pie chart
    http://bl.ocks.org/mbostock/3887193 Donut chart

  Options:
    config = {
      "label":    "pref",    // SPARQL letiable name for slice label (optional; default is the 1st letiable)
      "size":     "area",    // SPARQL letiable name for slice value (optional; default is the 2nd letiable)
      "width":    700,       // canvas width (optional)
      "height":   600,       // canvas height (optional)
      "margin":   10,        // canvas margin (optional)
      "hole":     50,        // radius size of a center hole (optional; 0 for pie, r > 0 for doughnut)
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.piechart(json, config)
    }

  CSS/SVG:
    <style>
    .label {
      font: 10px sans-serif;
    }
    .arc path {
      stroke: #ffffff;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {PieChartConfig} [config={}]
 */
d3sparql.piechart = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let label = config.label || head[0];
  let size = config.size || head[1];
  let width = config.width || 700;
  let height = config.height || 700;
  let margin = config.margin || 10;
  let selector = config.selector || null;
  let holeSize = config.hole || 100;

  let radius = Math.min(width, height) / 2 - margin;
  let hole = Math.max(Math.min(radius - 50, holeSize), 0);
  let color = d3.scale.category20();

  let arc = d3.svg.arc()
    .outerRadius(radius)
    .innerRadius(hole);

  let pie = d3.layout.pie()
    //.sort(null)
    .value((d) => d[size].value);

  let svg = d3sparql
    .select(selector, 'piechart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  let g = svg.selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc');
  let slice = g.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i));
  let text = g.append('text')
    .attr('class', 'label')
    .attr('transform', (d) => `translate(${arc.centroid(d)})`)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .text((d) => d.data[label].value);

  // default CSS/SVG
  slice.attr({
    'stroke': '#ffffff',
  });
  // TODO: not working?
  svg.selectAll('text').attr({
    'stroke': 'none',
    'fill': 'black',
    'font-size': '20px',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a scatter plot

  References:
    http://bl.ocks.org/mbostock/3244058

  Options:
    config = {
      "label_x":  "Size",    // label for x-axis (optional; default is same as let_x)
      "label_y":  "Count",   // label for y-axis (optional; default is same as let_y)
      "let_x":    "size",    // SPARQL letiable name for x-axis values (optional; default is the 1st letiable)
      "let_y":    "count",   // SPARQL letiable name for y-axis values (optional; default is the 2nd letiable)
      "let_r":    "volume",  // SPARQL letiable name for radius (optional; default is the 3rd letiable)
      "min_r":    1,         // minimum radius size (optional; default is 1)
      "max_r":    20,        // maximum radius size (optional; default is 20)
      "width":    850,       // canvas width (optional)
      "height":   300,       // canvas height (optional)
      "margin_x": 80,        // canvas margin x (optional)
      "margin_y": 40,        // canvas margin y (optional)
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.scatterplot(json, config)
    }

  CSS/SVG:
    <style>
    .label {
      font-size: 10pt;
    }
    .node circle {
      stroke: black;
      stroke-width: 1px;
      fill: pink;
      opacity: 0.5;
    }
    </style>
*/
/**
 *
 * @param {SparqlResults} json
 * @param {ScatterplotConfig} config
 */
d3sparql.scatterplot = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let label_x = config.label_x || head[0] || 'x';
  let label_y = config.label_y || head[1] || 'y';
  let label_r = config.label_r || head[2] || 'r';
  let let_x = config.let_x || head[0];
  let let_y = config.let_y || head[1];
  let let_r = config.let_r || head[2] || 5;
  let min_r = config.min_r || 1;
  let max_r = config.max_r || 20;
  let width = config.width || 850;
  let height = config.height || 300;
  let margin_x = config.margin_x || 80;
  let margin_y = config.margin_y || 40;
  let selector = config.selector || null;

  let extent_x = d3.extent(data, (d) => parseInt(d[let_x].value));
  let extent_y = d3.extent(data, (d) => parseInt(d[let_y].value));
  let extent_r = d3.extent(data, (d) => parseInt(d[let_r] ? d[let_r].value : let_r));

  let scale_x = d3.scale.linear().range([margin_x, width - margin_x]).domain(extent_x);
  let scale_y = d3.scale.linear().range([height - margin_y, margin_y]).domain(extent_y);
  let scale_r = d3.scale.linear().range([min_r, max_r]).domain(extent_r);
  let axis_x = d3.svg.axis().scale(scale_x);
  let axis_y = d3.svg.axis().scale(scale_y).orient('left');

  let svg = d3sparql
    .select(selector, 'scatterplot')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  let circle = svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('cx', (d) => scale_x(d[let_x].value))
    .attr('cy', (d) => scale_y(d[let_y].value))
    .attr('r', (d) => scale_r(d[let_r] ? d[let_r].value : let_r))
    .attr('opacity', 0.5)
    .append('title')
    .text((d) => d[label_r] ? d[label_r].value : label_r);

  let ax = svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (height - margin_y) + ')')
    .call(axis_x);

  let ay = svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + margin_x + ',0)')
    .call(axis_y);

  ax.append('text')
    .attr('class', 'label')
    .text(label_x)
    .style('text-anchor', 'middle')
    .attr('transform', 'translate(' + ((width - margin_x) / 2) + ',' + (margin_y - 5) + ')');
  ay.append('text')
    .attr('class', 'label')
    .text(label_y)
    .style('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0 - (height / 2))
    .attr('y', 0 - (margin_x - 20));

  // default CSS/SVG
  ax.attr({
    'stroke': 'black',
    'fill': 'none',
  });
  ay.attr({
    'stroke': 'black',
    'fill': 'none',
  });
  // This doesn't work with .append("circle") with .append("title") for tooltip
  circle.attr({
    'stroke': 'gray',
    'stroke-width': '1px',
    'fill': 'lightblue',
    'opacity': 0.5,
  });
  //svg.selectAll(".label").attr({
  svg.selectAll('text').attr({
    'stroke': 'none',
    'fill': 'black',
    'font-size': '8pt',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a force graph

  References:
    http://bl.ocks.org/mbostock/4062045

  Options:
    config = {
      "radius":   12,        // static value or a function to calculate radius of nodes (optional)
      "charge":   -250,      // force between nodes (optional; negative: repulsion, positive: attraction)
      "distance": 30,        // target distance between linked nodes (optional)
      "width":    1000,      // canvas width (optional)
      "height":   500,       // canvas height (optional)
      "label":    "name",    // SPARQL letiable name for node labels (optional)
      "selector": "#result"
      // options for d3sparql.graph() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.forcegraph(json, config)
    }

  CSS/SVG:
    <style>
    .link {
      stroke: #999999;
    }
    .node {
      stroke: black;
      opacity: 0.5;
    }
    circle.node {
      stroke-width: 1px;
      fill: lightblue;
    }
    text.node {
      font-family: "sans-serif";
      font-size: 8px;
    }
    </style>

  TODO:
    Try other d3.layout.force options.
*/
/**
 * @param {SparqlResults} json
 * @param {ForceGraphConfig} config
 */
d3sparql.forcegraph = function (json, config = {}) {
  let graph = (json.head && json.results) ? d3sparql.graph(json, config) : json;

  let radius = config.radius || ((d) => d.value ? scale(d.value) : 1 + d.label.length);
  let charge = config.charge || -500;
  let distance = config.distance || 50;
  let width = config.width || 1000;
  let height = config.height || 750;
  let label = config.label || false;
  let selector = config.selector || null;

  let scale = d3.scale.linear()
    .domain(d3.extent(graph.nodes, (d) => parseFloat(d.value)))
    .range([1, 20]);

  let svg = d3sparql
    .select(selector, 'forcegraph')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  let link = svg.selectAll('.link')
    .data(graph.links)
    .enter()
    .append('line')
    .attr('class', 'link');

  let node = svg.selectAll('.node')
    .data(graph.nodes)
    .enter()
    .append('g');

  let circle = node.append('circle')
    .attr('class', 'node')
    .attr('r', radius);

  let text = node.append('text')
    .text((d) => d[label || 'label'])
    .attr('class', 'node');

  let force = d3.layout.force()
    .charge(charge)
    .linkDistance(distance)
    .size([width, height])
    .nodes(graph.nodes)
    .links(graph.links)
    .start();

  force.on('tick', () => {
    link.attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    text.attr('x', (d) => d.x)
      .attr('y', (d) => d.y);

    circle.attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);
  });
  node.call(force.drag);

  // default CSS/SVG
  link.attr({
    'stroke': '#999999',
  });
  circle.attr({
    'stroke': 'black',
    'stroke-width': '1px',
    'fill': 'lightblue',
    'opacity': 1,
  });
  text.attr({
    'font-size': '8px',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a sanky graph

  References:
    https://github.com/d3/d3-plugins/tree/master/sankey
    http://bost.ocks.org/mike/sankey/

  Options:
    config = {
      "width":    1000,      // canvas width (optional)
      "height":   900,       // canvas height (optional)
      "margin":   50,        // canvas margin (optional)
      "selector": "#result"
      // options for d3sparql.graph() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.sankey(json, config)
    }

  CSS/SVG:
    <style>
    .node rect {
      cursor: move;
      fill-opacity: .9;
      shape-rendering: crispEdges;
    }
    .node text {
      pointer-events: none;
      text-shadow: 0 1px 0 #ffffff;
    }
    .link {
      fill: none;
      stroke: #000000;
      stroke-opacity: .2;
    }
    .link:hover {
      stroke-opacity: .5;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {SankeyConfig} config
 */
d3sparql.sankey = function (json, config = {}) {
  let graph = (json.head && json.results) ? d3sparql.graph(json, config) : json;

  let width = config.width || 750;
  let height = config.height || 1200;
  let margin = config.margin || 10;
  let selector = config.selector || null;

  let nodes = graph.nodes;
  let links = graph.links;
  for (let i = 0; i < links.length; i++) {
    links[i].value = 2;  // TODO: fix to use values on links
  }
  let sankey = d3.sankey()
    .size([width, height])
    .nodeWidth(15)
    .nodePadding(10)
    .nodes(nodes)
    .links(links)
    .layout(32);
  let path = sankey.link();
  let color = d3.scale.category20();
  let svg = d3sparql
    .select(selector, 'sankey')
    .append('svg')
    .attr('width', width + margin * 2)
    .attr('height', height + margin * 2)
    .append('g')
    .attr('transform', `translate(${margin},${margin})`);

  let link = svg
    .selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', path)
    .attr('stroke-width', (d) => Math.max(1, d.dy))
    .sort((a, b) => b.dy - a.dy);

  let node = svg
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .call(d3.behavior.drag()
      .origin((d) => d)
      .on('dragstart', function () {
        this.parentNode.appendChild(this);
      })
      .on('drag', dragmove)
    );

  node.append('rect')
    .attr('width', (d) => d.dx)
    .attr('height', (d) => d.dy)
    .attr('fill', (d) => color(d.label))
    .attr('opacity', 0.5);
  node.append('text')
    .attr('x', -6)
    .attr('y', (d) => d.dy / 2)
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .attr('transform', null)
    .text((d) => d.label)
    .filter((d) => d.x < width / 2)
    .attr('x', 6 + sankey.nodeWidth())
    .attr('text-anchor', 'start');

  // default CSS/SVG
  link.attr({
    'fill': 'none',
    'stroke': 'grey',
    'opacity': 0.5,
  });

  function dragmove(d) {
    d3.select(this)
      // TODO: remove this inline assignment
      .attr('transform', `translate(${d.x},${(d.y = Math.max(0, Math.min(height - d.dy, d3.event.y)))})`);
    sankey.relayout();
    link.attr('d', path);
  }
};


/*
  Rendering sparql-results+json object into a round tree

  References:
    http://bl.ocks.org/4063550  Reingold-Tilford Tree

  Options:
    config = {
      "diameter": 800,       // canvas diameter (optional)
      "angle":    360,       // arc angle (optional; less than 360 for wedge)
      "depth":    200,       // arc depth (optional; less than diameter/2 - label length to fit)
      "radius":   5,         // node radius (optional)
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.roundtree(json, config)
    }

  CSS/SVG:
    <style>
    .link {
      fill: none;
      stroke: #cccccc;
      stroke-width: 1.5px;
    }
    .node circle {
      fill: #ffffff;
      stroke: darkgreen;
      stroke-width: 1.5px;
      opacity: 1;
    }
    .node text {
      font-size: 10px;
      font-family: sans-serif;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {RoundTreeConfig} config
 */
d3sparql.roundtree = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let diameter = config.diameter || 800;
  let angle = config.angle || 360;
  let depth = config.depth || 200;
  let radius = config.radius || 5;
  let selector = config.selector || null;

  let tree_layout = d3.layout.tree()
    .size([angle, depth])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

  let nodes = tree_layout.nodes(tree);

  let links = tree_layout.links(nodes);

  let diagonal = d3.svg.diagonal.radial()
    .projection((d) => [d.y, d.x / 180 * Math.PI]);

  let svg = d3sparql
    .select(selector, 'roundtree')
    .append('svg')
    .attr('width', diameter)
    .attr('height', diameter)
    .append('g')
    .attr('transform', `translate(${diameter / 2},${diameter / 2})`);

  let link = svg.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', diagonal);

  let node = svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `rotate(${(d.x - 90)}) translate(${d.y})`);

  let circle = node
    .append('circle')
    .attr('r', radius);

  let text = node
    .append('text')
    .attr('dy', '.35em')
    .attr('text-anchor', (d) => d.x < 180 ? 'start' : 'end')
    .attr('transform', (d) => d.x < 180 ? 'translate(8)' : 'rotate(180) translate(-8)')
    .text((d) => d.name);

  // default CSS/SVG
  link.attr({
    'fill': 'none',
    'stroke': '#cccccc',
    'stroke-width': '1.5px',
  });
  circle.attr({
    'fill': '#ffffff',
    'stroke': 'steelblue',
    'stroke-width': '1.5px',
    'opacity': 1,
  });
  text.attr({
    'font-size': '10px',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a dendrogram

  References:
    http://bl.ocks.org/4063570  Cluster Dendrogram

  Options:
    config = {
      "width":    900,       // canvas width (optional)
      "height":   4500,      // canvas height (optional)
      "margin":   300,       // width margin for labels (optional)
      "radius":   5,         // radius of node circles (optional)
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.dendrogram(json, config)
    }

  CSS/SVG:
    <style>
    .link {
      fill: none;
      stroke: #cccccc;
      stroke-width: 1.5px;
    }
    .node circle {
      fill: #ffffff;
      stroke: steelblue;
      stroke-width: 1.5px;
      opacity: 1;
    }
    .node text {
      font-size: 10px;
      font-family: sans-serif;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {DendrogramConfig} [config={}]
 */
d3sparql.dendrogram = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let width = config.width || 800;
  let height = config.height || 2000;
  let margin = config.margin || 350;
  let radius = config.radius || 5;
  let selector = config.selector || null;

  let cluster = d3.layout.cluster()
    .size([height, width - margin]);

  let diagonal = d3.svg.diagonal()
    .projection((d) => [d.y, d.x]);

  let svg = d3sparql
    .select(selector, 'dendrogram')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(40,0)');

  let nodes = cluster.nodes(tree);
  let links = cluster.links(nodes);

  let link = svg.selectAll('.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', diagonal);

  let node = svg.selectAll('.node')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.y},${d.x})`);

  let circle = node
    .append('circle')
    .attr('r', radius);

  let text = node
    .append('text')
    .attr('dx', (d) => (d.parent && d.children) ? -8 : 8)
    .attr('dy', 5)
    .style('text-anchor', (d) => (d.parent && d.children) ? 'end' : 'start')
    .text((d) => d.name);

  // default CSS/SVG
  link.attr({
    'fill': 'none',
    'stroke': '#cccccc',
    'stroke-width': '1.5px',
  });
  circle.attr({
    'fill': '#ffffff',
    'stroke': 'steelblue',
    'stroke-width': '1.5px',
    'opacity': 1,
  });
  text.attr({
    'font-size': '10px',
    'font-family': 'sans-serif',
  });
};

/*
  Rendering sparql-results+json object into a sunburst

  References:
    http://bl.ocks.org/4348373  Zoomable Sunburst
    http://www.jasondavies.com/coffee-wheel/  Coffee Flavour Wheel

  Options:
    config = {
      "width":    1000,      // canvas width (optional)
      "height":   900,       // canvas height (optional)
      "margin":   150,       // margin for labels (optional)
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.sunburst(json, config)
    }

  CSS/SVG:
    <style>
    .node text {
      font-size: 10px;
      font-family: sans-serif;
    }
    .arc {
      stroke: #ffffff;
      fill-rule: evenodd;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {SunburstConfig} [config={}]
 */
d3sparql.sunburst = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let width = config.width || 1000;
  let height = config.height || 900;
  let margin = config.margin || 150;
  let selector = config.selector || null;

  let radius = Math.min(width, height) / 2 - margin;
  let x = d3.scale.linear().range([0, 2 * Math.PI]);
  let y = d3.scale.sqrt().range([0, radius]);
  let color = d3.scale.category20();

  let svg = d3sparql
    .select(selector, 'sunburst')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  let arc = d3.svg.arc()
    .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, x(d.x))))
    .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))))
    .innerRadius((d) => Math.max(0, y(d.y)))
    .outerRadius((d) => Math.max(0, y(d.y + d.dy)));

  let partition = d3.layout.partition()
    .value((d) => d.value);

  let nodes = partition.nodes(tree);

  let path = svg
    .selectAll('path')
    .data(nodes)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('class', 'arc')
    .style('fill', (d) => color((d.children ? d : d.parent).name))
    .on('click', click);

  let text = svg
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .attr('transform', (d) => {
      let rotate = x(d.x + d.dx / 2) * 180 / Math.PI - 90;
      return `rotate(${rotate}) translate(${y(d.y)})`;
    })
    .attr('dx', '.5em')
    .attr('dy', '.35em')
    .text((d) => d.name)
    .on('click', click);

  // default CSS/SVG
  path.attr({
    'stroke': '#ffffff',
    'fill-rule': 'evenodd',
  });
  text.attr({
    'font-size': '10px',
    'font-family': 'sans-serif',
  });

  let maxDepth = (d) => d.children ? Math.max.apply(Math, d.children.map(maxDepth)) : d.y + d.dy;

  let arcTween = (d) => {
    let xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, maxDepth(d)]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);

    return (data) => (t) => {
      x.domain(xd(t));
      y.domain(yd(t)).range(yr(t));
      return arc(data);
    };
  };

  let isParentOf = (p, c) => {
    if (p === c) {
      return true;
    }
    if (p.children) {
      return p.children.some((d) => isParentOf(d, c));
    }
    return false;
  };

  function click(d) {
    path.transition()
      .duration(750)
      .attrTween('d', arcTween(d));
    text.style('visibility', function (e) {
        // required for showing labels just before the transition when zooming back to the upper level
        return isParentOf(d, e) ? null : d3.select(this).style('visibility');
      })
      .transition()
      .duration(750)
      .attrTween('transform', (d) => () => {
        let rotate = x(d.x + d.dx / 2) * 180 / Math.PI - 90;
        return `rotate(${rotate}) translate(${y(d.y)})`;
      })
      .each('end', function (e) {
        // required for hiding labels just after the transition when zooming down to the lower level
        d3.select(this).style('visibility', isParentOf(d, e) ? null : 'hidden');
      });
  }
};

/*
  Rendering sparql-results+json object into a circle pack

  References:
    http://mbostock.github.com/d3/talk/20111116/pack-hierarchy.html  Circle Packing

  Options:
    config = {
      "width":    800,       // canvas width (optional)
      "height":   800,       // canvas height (optional)
      "diameter": 700,       // diamieter of the outer circle (optional)
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.circlepack(json, config)
    }

  CSS/SVG:
    <style>
    text {
      font-size: 11px;
      pointer-events: none;
    }
    text.parent {
      fill: #1f77b4;
    }
    circle {
      fill: #cccccc;
      stroke: #999999;
      pointer-events: all;
    }
    circle.parent {
      fill: #1f77b4;
      fill-opacity: .1;
      stroke: steelblue;
    }
    circle.parent:hover {
      stroke: #ff7f0e;
      stroke-width: .5px;
    }
    circle.child {
      pointer-events: none;
    }
    </style>

  TODO:
    Fix rotation angle for each text to avoid string collision
*/
/**
 * @param {SparqlResults} json
 * @param {CirclePackConfig} config
 */
d3sparql.circlepack = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let width = config.width || 800;
  let height = config.height || 800;
  let diameter = config.diameter || 700;
  let selector = config.selector || null;

  let w = width;
  let h = height;
  let r = diameter;
  let x = d3.scale.linear().range([0, r]);
  let y = d3.scale.linear().range([0, r]);

  let pack = d3.layout.pack()
    .size([r, r])
    .value((d) => d.value);

  let node = tree;
  let nodes = pack.nodes(tree);

  let vis = d3sparql.select(selector, 'circlepack').append('svg')
    .attr('width', w)
    .attr('height', h)
    .append('g')
    .attr('transform', 'translate(' + (w - r) / 2 + ',' + (h - r) / 2 + ')');

  vis.selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', function (d) {
      return d.children ? 'parent' : 'child';
    })
    .attr('cx', function (d) {
      return d.x;
    })
    .attr('cy', function (d) {
      return d.y;
    })
    .attr('r', function (d) {
      return d.r;
    })
    /*
        // CSS: circle { ... }
        .attr("fill", function(d) { return d.children ? "#1f77b4" : "#cccccc" })
        .attr("fill-opacity", function(d) { return d.children ? ".1" : "1" })
        .attr("stroke", function(d) { return d.children ? "steelblue" : "#999999" })
        .attr("pointer-events", function(d) { return d.children ? "all" : "none" })
        .on("mouseover", function() { d3.select(this).attr("stroke", "#ff7f0e").attr("stroke-width", ".5px") })
        .on("mouseout", function() { d3.select(this).attr("stroke", "steelblue").attr("stroke-width", ".5px") })
    */
    .on('click', function (d) {
      return zoom(node === d ? tree : d);
    });

  vis.selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .attr('class', function (d) {
      return d.children ? 'parent' : 'child';
    })
    .attr('x', function (d) {
      return d.x;
    })
    .attr('y', function (d) {
      return d.y;
    })
    //    .attr("dy", ".35em")
    .style('opacity', function (d) {
      return d.r > 20 ? 1 : 0;
    })
    .text(function (d) {
      return d.name;
    })
    // rotate to avoid string collision
    //.attr("text-anchor", "middle")
    .attr('text-anchor', 'start')
    .transition()
    .duration(1000)
    .attr('transform', function (d) {
      return 'rotate(-30, ' + d.x + ', ' + d.y + ')';
    });

  d3.select(window).on('click', function () {
    zoom(tree);
  });

  function zoom(d, i) {
    let k = r / d.r / 2;
    x.domain([d.x - d.r, d.x + d.r]);
    y.domain([d.y - d.r, d.y + d.r]);
    let t = vis.transition()
      .duration(d3.event.altKey ? 2000 : 500);
    t.selectAll('circle')
      .attr('cx', function (d) {
        return x(d.x);
      })
      .attr('cy', function (d) {
        return y(d.y);
      })
      .attr('r', function (d) {
        return k * d.r;
      });
    t.selectAll('text')
      .attr('x', function (d) {
        return x(d.x);
      })
      .attr('y', function (d) {
        return y(d.y);
      })
      .style('opacity', function (d) {
        return k * d.r > 20 ? 1 : 0;
      });
    d3.event.stopPropagation();
  }
};

/*
  Rendering sparql-results+json object into a treemap

  References:
    http://bl.ocks.org/4063582  Treemap

  Options:
    config = {
      "width":    800,       // canvas width (optional)
      "height":   500,       // canvas height (optional)
      "margin":   {"top": 10, "right": 10, "bottom": 10, "left": 10},
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.treemap(json, config)
    }

  CSS/SVG:
    <style>
    .node {
      border: solid 1px white;
      font: 10px sans-serif;
      line-height: 12px;
      overflow: hidden;
      position: absolute;
      text-indent: 2px;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {TreeMapConfig} [config={}]
 */
d3sparql.treemap = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let width = config.width || 800;
  let height = config.height || 500;
  let count = config.count || false;
  let color = config.color || d3.scale.category20c();
  let margin = config.margin || { top: 0, right: 0, bottom: 0, left: 0 };
  let selector = config.selector || null;

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  let getCount = (d) => 1;
  let getSize = (d) => d.value;

  let treemap = d3.layout.treemap()
    .size([width, height])
    .sticky(true)
    .value(count ? getCount : getSize);

  let div = d3sparql.select(selector, 'treemap')
    .style('position', 'relative')
    .style('width', width + 'px')
    .style('height', height + 'px')
    .style('left', margin.left + 'px')
    .style('top', margin.top + 'px');

  function position() {
    this.style('left', function (d) {
        return d.x + 'px';
      })
      .style('top', function (d) {
        return d.y + 'px';
      })
      .style('width', function (d) {
        return Math.max(0, d.dx - 1) + 'px';
      })
      .style('height', function (d) {
        return Math.max(0, d.dy - 1) + 'px';
      });
  }

  let node = div.datum(tree).selectAll('.node')
    .data(treemap.nodes)
    .enter()
    .append('div')
    .attr('class', 'node')
    .call(position)
    .style('background', (d) => d.children ? color(d.name) : null)
    .text((d) => d.children ? null : d.name);

  // default CSS/SVG
  node.style({
    'border-style': 'solid',
    'border-width': '1px',
    'border-color': 'white',
    'font-size': '10px',
    'font-family': 'sans-serif',
    'line-height': '12px',
    'overflow': 'hidden',
    'position': 'absolute',
    'text-indent': '2px',
  });
};

/*
  Rendering sparql-results+json object into a zoomable treemap

  References:
    http://bost.ocks.org/mike/treemap/  Zoomable Treemaps
    http://bl.ocks.org/zanarmstrong/76d263bd36f312cb0f9f

  Options:
    config = {
      "width":    800,       // canvas width (optional)
      "height":   500,       // canvas height (optional)
      "margin":   {"top": 10, "right": 10, "bottom": 10, "left": 10},
      "selector": "#result"
      // options for d3sparql.tree() can be added here ...
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      let config = { ... }
      d3sparql.treemapzoom(json, config)
    }

  CSS/SVG:
    <style>
    rect {
      cursor: pointer;
    }
    .grandparent:hover rect {
      opacity: 0.8;
    }
    .children:hover rect.child {
      opacity: 0.2;
    }
    </style>
*/
/**
 * @param {SparqlResults} json
 * @param {TreeMapZoomConfig} config
 */
d3sparql.treemapzoom = function (json, config = {}) {
  let tree = (json.head && json.results) ? d3sparql.tree(json, config) : json;

  let opts = {
    'width': config.width || 800,
    'height': config.height || 500,
    'margin': config.margin || { top: 25, right: 0, bottom: 0, left: 0 },
    'color': config.color || d3.scale.category20(),
    'format': config.format || d3.format(',d'),
    'selector': config.selector || null
  };

  let width = opts.width - opts.margin.left - opts.margin.right;
  let height = opts.height - opts.margin.top - opts.margin.bottom;
  let color = opts.color;
  let format = opts.format;
  let transitioning;

  let x = d3.scale.linear().domain([0, width]).range([0, width]);
  let y = d3.scale.linear().domain([0, height]).range([0, height]);

  let treemap = d3.layout.treemap()
    .children(function (d, depth) {
      return depth ? null : d.children;
    })
    .sort(function (a, b) {
      return a.value - b.value;
    })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

  let svg = d3sparql
    .select(opts.selector, 'treemapzoom')
    .append('svg')
    .attr('width', opts.width)
    .attr('height', opts.height)
    .style('margin-left', -opts.margin.left + 'px')
    .style('margin.right', -opts.margin.right + 'px')
    .append('g')
    .attr('transform', 'translate(' + opts.margin.left + ',' + opts.margin.top + ')')
    .style('shape-rendering', 'crispEdges');

  let grandparent = svg.append('g')
    .attr('class', 'grandparent');

  grandparent.append('rect')
    .attr('y', -opts.margin.top)
    .attr('width', width)
    .attr('height', opts.margin.top)
    .attr('fill', '#666666');

  grandparent.append('text')
    .attr('x', 6)
    .attr('y', 6 - opts.margin.top)
    .attr('dy', '.75em')
    .attr('stroke', '#ffffff')
    .attr('fill', '#ffffff');

  let initialize = (tree) => {
    tree.x = tree.y = 0;
    tree.dx = width;
    tree.dy = height;
    tree.depth = 0;
  };

  // Compute the treemap layout recursively such that each group of siblings
  // uses the same size (1×1) rather than the dimensions of the parent cell.
  // This optimizes the layout for the current zoom state. Note that a wrapper
  // object is created for the parent node for each group of siblings so that
  // the parent’s dimensions are not discarded as we recurse. Since each group
  // of sibling was laid out in 1×1, we must rescale to fit using absolute
  // coordinates. This lets us use a viewport to zoom.
  let layout = (d) => {
    if (!d.children) {
      return;
    }
    treemap.nodes({ children: d.children });
    d.children.forEach((c) => {
      c.x = d.x + c.x * d.dx;
      c.y = d.y + c.y * d.dy;
      c.dx *= d.dx;
      c.dy *= d.dy;
      c.parent = d;
      layout(c);
    });
  };

  initialize(tree);
  layout(tree);
  display(tree);

  function display(d) {
    grandparent
      .datum(d.parent)
      .on('click', transition)
      .select('text')
      .text(name(d));

    let g1 = svg.insert('g', '.grandparent')
      .datum(d)
      .attr('class', 'depth');

    let g = g1.selectAll('g')
      .data(d.children)
      .enter()
      .append('g');

    g.filter(function (d) {
        return d.children;
      })
      .classed('children', true)
      .on('click', transition);

    g.selectAll('.child')
      .data(function (d) {
        return d.children || [d];
      })
      .enter()
      .append('rect')
      .attr('class', 'child')
      .call(rect);

    g.append('rect')
      .attr('class', 'parent')
      .call(rect)
      .append('title')
      .text(function (d) {
        return format(d.value);
      });

    g.append('text')
      .attr('dy', '.75em')
      .text(function (d) {
        return d.name;
      })
      .call(text);

    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;
      let g2 = display(d),
        t1 = g1.transition().duration(750),
        t2 = g2.transition().duration(750);

      // Update the domain only after entering new elements.
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      // Enable anti-aliasing during the transition.
      svg.style('shape-rendering', null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll('.depth').sort(function (a, b) {
        return a.depth - b.depth;
      });

      // Fade-in entering text.
      g2.selectAll('text').style('fill-opacity', 0);

      // Transition to the new view.
      t1.selectAll('text').call(text).style('fill-opacity', 0);
      t2.selectAll('text').call(text).style('fill-opacity', 1);
      t1.selectAll('rect').call(rect);
      t2.selectAll('rect').call(rect);

      // Remove the old node when the transition is finished.
      t1.remove().each('end', function () {
        svg.style('shape-rendering', 'crispEdges');
        transitioning = false;
      });
    }

    return g;
  }

  function text(text) {
    text.attr('x', function (d) {
        return x(d.x) + 6;
      })
      .attr('y', function (d) {
        return y(d.y) + 6;
      });
  }

  function rect(rect) {
    rect.attr('x', function (d) {
        return x(d.x);
      })
      .attr('y', function (d) {
        return y(d.y);
      })
      .attr('width', function (d) {
        return x(d.x + d.dx) - x(d.x);
      })
      .attr('height', function (d) {
        return y(d.y + d.dy) - y(d.y);
      })
      .attr('fill', function (d) {
        return color(d.name);
      });
    rect.attr({
      'stroke': '#ffffff',
      'stroke-width': '1px',
      'opacity': 0.8,
    });
  }

  function name(d) {
    return d.parent
      ? name(d.parent) + ' / ' + d.name
      : d.name;
  }
};

/*
  World Map spotted by coordinations (longitude and latitude)

  Options:
    config = {
      "let_lat":  "lat",     // SPARQL letiable name for latitude (optional; default is the 1st letiable)
      "let_lng":  "lng",     // SPARQL letiable name for longitude (optional; default is the 2nd letiable)
      "width":    960,       // canvas width (optional)
      "height":   480,       // canvas height (optional)
      "radius":   5,         // circle radius (optional)
      "color":    "#FF3333,  // circle color (optional)
      "topojson": "path/to/world-50m.json",  // TopoJSON file
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      d3sparql.coordmap(json, config = {})
    }

  Dependencies:
    * topojson.js
      * Download from http://d3js.org/topojson.v1.min.js
      * Put <script src="topojson.js"></script> in the HTML <head> section
    * world-50m.json
      * Download from https://github.com/mbostock/topojson/blob/master/examples/world-50m.json
*/
/**
 * @param {SparqlResults} json
 * @param {CoordMapConfig} [config={}]
 */
d3sparql.coordmap = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let let_lat = config.let_lat || head[0] || 'lat';
  let let_lng = config.let_lng || head[1] || 'lng';
  let width = config.width || 960;
  let height = config.height || 480;
  let radius = config.radius || 5;
  let color = config.color || '#FF3333';
  let topojsonFile = config.topojson || 'world-50m.json';
  let selector = config.selector || null;

  let projection = d3.geo.equirectangular()
    .scale(153)
    .translate([width / 2, height / 2])
    .precision(.1);
  let path = d3.geo.path()
    .projection(projection);
  let graticule = d3.geo.graticule();
  let svg = d3sparql.select(selector, 'coordmap').append('svg')
    .attr('width', width)
    .attr('height', height);

  svg.append('path')
    .datum(graticule.outline)
    .attr('fill', '#a4bac7')
    .attr('d', path);

  svg.append('path')
    .datum(graticule)
    .attr('fill', 'none')
    .attr('stroke', '#333333')
    .attr('stroke-width', '.5px')
    .attr('stroke-opacity', '.5')
    .attr('d', path);

  d3.json(topojsonFile, (error, world) => {
    if (error) {
      throw error;
    }

    svg.insert('path', '.graticule')
      .datum(topojson.feature(world, world.objects.land))
      .attr('fill', '#d7c7ad')
      .attr('stroke', '#766951')
      .attr('d', path);

    svg.insert('path', '.graticule')
      .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
      .attr('class', 'boundary')
      .attr('fill', 'none')
      .attr('stroke', '#a5967e')
      .attr('stroke-width', '.5px')
      .attr('d', path);

    svg.selectAll('.pin')
      .data(data)
      .enter().append('circle', '.pin')
      .attr('fill', color)
      .attr('r', radius)
      .attr('stroke', '#455346')
      .attr('transform', function (d) {
        return 'translate(' + projection([
          d[let_lng].value,
          d[let_lat].value
        ]) + ')';
      });
  });
};

/*
  World Map colored by location names defined in a TopoJSON file

  Options:
    config = {
      "label":       "name",    // SPARQL letiable name for location names (optional; default is the 1st letiable)
      "value":       "size",    // SPARQL letiable name for numerical values (optional; default is the 2nd letiable)
      "width":       1000,      // canvas width (optional)
      "height":      1000,      // canvas height (optional)
      "color_max":   "blue",    // color for maximum value (optional)
      "color_min":   "white",   // color for minimum value (optional)
      "color_scale": "linear"   // color scale (optional; "linear" or "log")
      "topojson":    "path/to/japan.topojson",  // TopoJSON file
      "mapname":     "japan",   // JSON key name of a map location root (e.g., "objects":{"japan":{"type":"GeometryCollection", ...)
      "keyname":     "name",    // JSON key name of map locations matched with "label" (e.g., "properties":{"name":"Tokyo", ...)
      "center_lat":  34,        // latitude for a map location center (optional; default is 34 for Japan)
      "center_lng":  137,       // longitude for a map location center (optional; default is 137 for Japan)
      "scale":       10000,     // scale of rendering (optional)
      "selector":    "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      d3sparql.namedmap(json, config = {})
    }

  Dependencies:
    * topojson.js
      * Download from http://d3js.org/topojson.v1.min.js
      * Put <script src="topojson.js"></script> in the HTML <head> section
    * japan.topojson
      * Download from https://github.com/sparql-book/sparql-book/blob/master/chapter5/D3/japan.topojson
*/
/**
 * @param {SparqlResults} json
 * @param {NamedMapConfig} [config={}]
 */
d3sparql.namedmap = function (json, config = {}) {
  let head = json.head.lets || json.head.vars || [];
  let data = json.results.bindings;

  let label = config.label || head[0] || 'label';
  let value = config.value || head[1] || 'value';
  let width = config.width || 1000;
  let height = config.height || 1000;
  let color_max = config.color_max || 'red';
  let color_min = config.color_min || 'white';
  let color_scale = config.color_scale || 'log';
  let topojsonFile = config.topojson || 'japan.topojson';
  let mapname = config.mapname || 'japan';
  let keyname = config.keyname || 'name_local';
  let center_lat = config.center_lat || 34;
  let center_lng = config.center_lng || 137;
  let scale = config.scale || 10000;
  let selector = config.selector || null;

  let size = d3
    .nest()
    .key((d) => d[label].value)
    .rollup((d) => d3.sum(d, (d) => parseInt(d[value].value)))
    .map(data);

  let extent = d3.extent((d3.map(size).values()));

  debug(size);

  let svg = d3sparql
    .select(selector, 'namedmap').append('svg')
    .attr('width', width)
    .attr('height', height);

  d3.json(topojsonFile, (topojson_map) => {
    let geo = topojson.feature(topojson_map, topojson_map.objects[mapname]).features;

    let projection = d3.geo.mercator()
      .center([center_lng, center_lat])
      .translate([width / 2, height / 2])
      .scale(scale);

    let path = d3.geo.path().projection(projection);

    let scaleFn;
    switch (color_scale) {
      case 'log':
        scaleFn = d3.scale.log();
        break;
      default:
        scaleFn = d3.scale.linear();
        break;
    }
    let color = scaleFn.domain(extent).range([color_min, color_max]);

    svg.selectAll('path')
      .data(geo)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .style('fill', function (d, i) {
        // map SPARQL results to colors
        return color(size[d.properties[keyname]]);
      });

    svg.selectAll('.place-label')
      .data(geo)
      .enter()
      .append('text')
      .attr('font-size', '8px')
      .attr('class', 'place-label')
      .attr('transform', function (d) {
        let lat = d.properties.latitude;
        let lng = d.properties.longitude;
        return 'translate(' + projection([lng, lat]) + ')';
      })
      .attr('dx', '-1.5em')
      .text((d) => d.properties[keyname]);
  });
};

/**
 * @param {string|EventTarget} [selector] if not given, will use body
 * @param {string} type
 * @returns {d3.Selection<any>}
 */
d3sparql.select = function (selector, type) {
  const elem = selector ? d3.select(selector).html('') : d3.select('body');
  return elem.append('div').attr('class', 'd3sparql ' + type);
};

/* Helper function only for the d3sparql web site */
d3sparql.toggle = function () {
  let button = d3.select('#button');
  let elem = d3.select('#sparql');
  if (elem.style('display') === 'none') {
    elem.style('display', 'inline');
    button.attr('class', 'icon-chevron-up');
  } else {
    elem.style('display', 'none');
    button.attr('class', 'icon-chevron-down');
  }
};

/* for IFRAME embed */
d3sparql.frameheight = function (height) {
  d3.select(self.frameElement).style('height', height + 'px');
};
