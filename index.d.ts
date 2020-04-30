import * as d3 from 'd3';

export = d3sparql;
export as namespace d3sparql;

declare namespace d3sparql {
  /**
   * The current version of D3.js.
   */
  export var version: string;

  /**
   * Whether or not to log debug messages.
   */
  export var debug: boolean;

  // Query tools

  export function fetch(url: string, init?: RequestInit): Promise<SparqlResults>;

  export function query(endpoint: string, sparql: string, type?: 'GET' | 'POST'): Promise<SparqlResults>;

  // Trees

  export function tree(json: SparqlResults, config?: tree.TreeConfig): tree.Tree;

  export function treemap(json: SparqlResults, config?: tree.TreeMapConfig);

  export function treemapzoom(json: SparqlResults, config?: tree.TreeMapZoomConfig);

  export function roundtree(json: SparqlResults, config?: tree.RoundTreeConfig);

  export function dendrogram(json: SparqlResults, config?: tree.DendrogramConfig);

  export function sunburst(json: SparqlResults, config?: tree.SunburstConfig);

  export function circlepack(json: SparqlResults, config?: tree.CirclePackConfig);

  // Graphs

  export function graph(json: SparqlResults, config?: graph.GraphConfig): graph.Graph;

  export function forcegraph(json: SparqlResults, config?: graph.ForceGraphConfig);

  export function sankey(json: SparqlResults, config?: graph.SankeyConfig);

  // Tables

  export function htmltable(json: SparqlResults, config?: table.HTMLTableConfig);

  export function htmlhash(json: SparqlResults, config?: table.HTMLHashConfig);

  // Charts

  export function barchart(json: SparqlResults, config?: chart.BarChartConfig);

  export function piechart(json: SparqlResults, config?: chart.PieChartConfig);

  export function scatterplot(json: SparqlResults, config?: chart.ScatterplotConfig);

  // Maps

  export function coordmap(json: SparqlResults, config?: geomap.CoordMapConfig);

  export function namedmap(json: SparqlResults, config?: geomap.NamedMapConfig);

  // Utilities

  export function select(selector: Selector, type: string): d3.Selection<any>;

  // TODO: remove these functions, as they're only used on the demo site
  export function toggle();

  export function frameheight(height: number);

  // Types

  /**
   * A JSON encoding of RDF terms.
   */
  export type SparqlResultTerm =
    {
      type: 'uri';
      value: string;
    }
    |
    {
      type: 'literal';
      "xml:lang"?: string;
      value: string;
    }
    |
    {
      type: 'literal';
      datatype: string;
      value: string;
    }
    |
    {
      type: 'bnode';
      value: string;
    };

  type SparqlResultBinding = Record<string, SparqlResultTerm>;

  interface SparqlResults {
    head: {
      links?: object[];
      vars?: string[];
      lets?: string[];
    };


    /**
     * Optional boolean result of ASK queries.
     */
    boolean?: boolean;

    /**
     * Results from queries like SELECT.
     */
    results?: {
      bindings: SparqlResultBinding[];
    };
  }

  export type Selector = string | EventTarget | null;

  interface SelectorConfig {
    selector?: Selector;
  }

  namespace graph {
    interface GraphConfig {
      key1?: string;
      key2?: string;
      label1?: string;
      label2?: string;
      value1?: string;
      value2?: string;
    }

    interface ForceGraphConfig extends SelectorConfig, GraphConfig {
      radius?: (x: SparqlResultTerm) => number;
      charge?: number;
      distance?: number;
      width?: number;
      height?: number;
      label?: string;
    }

    interface SankeyConfig extends GraphConfig, SelectorConfig {
      width?: number;
      height?: number;
      margin?: number;
    }

    // A node
    interface GraphNode {
      key: string;
      label: string;
      value: string;
    }

    // An edge
    interface GraphLink {
      source: string;
      target: string;
    }

    interface Graph {
      nodes: GraphNode[];
      links: GraphLink[];
    }
  }

  namespace tree {
    interface TreeConfig {
      root?: string;
      parent?: string;
      child?: string;
      value?: string;
    }

    interface TreeMapConfig extends TreeConfig, SelectorConfig {
      width?: number;
      height?: number;
      count?: number;
      color?: (name: string) => string;
      margin?: { top: number, right: number, bottom: number, left: number };
    }

    interface TreeMapZoomConfig extends TreeMapConfig {
      format?: (name: number) => string;
    }


    interface RoundTreeConfig extends TreeConfig, SelectorConfig {
      diameter?: number;
      angle?: number;
      depth?: number;
      radius?: number;
    }

    interface DendrogramConfig extends TreeConfig, SelectorConfig {
      width?: number;
      height?: number;
      count?: number;
      color?: (name: string) => string;
      margin?: number;
    }

    interface SunburstConfig extends TreeConfig, SelectorConfig {
      width?: number;
      height?: number;
      margin?: number;
    }

    interface CirclePackConfig extends TreeConfig, SelectorConfig {
      width?: number;
      height?: number;
      diameter?: number;
    }


    interface TreeNode {
      value: number;
      name: string;
      children?: TreeNode[];
    }

    /**
     * Alias for convenience.
     */
    type Tree = TreeNode;
  }

  namespace table {
    interface HTMLTableConfig extends SelectorConfig {
      columns?: string[];
      headers?: string[];
      limit?: number;
      offset?: number;
    }

    interface HTMLHashConfig extends SelectorConfig {
    }
  }

  namespace chart {
    interface BarChartConfig extends SelectorConfig {
      label_x?: string;
      label_y?: string;
      let_x?: string;
      let_y?: string;
      width?: number;
      height?: number;
      margin?: number;
    }

    interface PieChartConfig extends SelectorConfig {
      label?: string;
      width?: number;
      height?: number;
      margin?: number;
      size?: number;
      hole?: number;
    }

    interface ScatterplotConfig extends SelectorConfig {
      label_x?: string;
      label_y?: string;
      label_r?: string;
      let_x?: string;
      let_y?: string;
      let_r?: string | number;
      min_r?: number;
      max_r?: number;
      width?: number;
      height?: number;
      margin_x?: number;
      margin_y?: number;
    }
  }

  namespace geomap {
    interface CoordMapConfig extends SelectorConfig {
      let_lat?: string;
      let_lng?: string;
      width?: number;
      height?: number;
      radius?: number;
      color?: string;
      /**
       * Name of topojson .json map file.
       */
      topojson?: string;
    }

    interface NamedMapConfig extends SelectorConfig {
      label?: string;
      value?: string;
      width?: number;
      height?: number;
      color_max?: string;
      color_min?: string;
      color_scale?: string;
      mapname?: string;
      keyname?: string;
      center_lat?: number;
      center_lng?: number;
      scale?: number;
      /**
       * Name of topojson .json map file.
       */
      topojson?: string;
    }
  }
}
