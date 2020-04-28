import * as d3 from 'd3';

export = d3sparql;
export as namespace d3sparql;

declare namespace d3sparql {
  import TreeConfig = d3sparql.tree.TreeConfig;
  import TreeMapConfig = d3sparql.tree.TreeMapConfig;
  import GraphConfig = d3sparql.graph.GraphConfig;
  /**
   * The current version of D3.js.
   */
  export var version: string;

  export var debug: boolean;

  export function tree(json: SparqlResults, config?: TreeConfig): tree.Tree;
  export function treemap(json: SparqlResults, config?: TreeConfig & TreeMapConfig);

  export function graph(json: SparqlResults, config?: GraphConfig): graph.Graph;

  export function htmltable(json: SparqlResults, config?: table.HTMLTableConfig);
  export function htmlhash(json: SparqlResults, config?: table.HTMLHashConfig);

  export function barchart(json: SparqlResults, config?: chart.BarChartConfig);
  export function piechart(json: SparqlResults, config?: chart.PieChartConfig);


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
      bindings: Record<string, SparqlQueryResultTerm>[]
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

    interface TreeMapConfig extends SelectorConfig {
      width?: number;
      height?: number;
      count?: number;
      color?: (name: string) => string;
      margin?: { top: number, right: number, bottom: number, left: number };
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

    interface HTMLHashConfig extends SelectorConfig {}
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
  }


  /**
   * A JSON encoding of RDF terms.
   */
  export type SparqlQueryResultTerm =
    {
      type: 'uri';
      value: string;
    }
    |
    {
      type: 'literal';
      value: string;
    }
    |
    {
      type: 'literal';
      "xml:lang": string;
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
}
