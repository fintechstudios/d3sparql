import * as d3 from 'd3';

export = d3sparql;
export as namespace d3sparql;

declare namespace d3sparql {
  import TreeConfig = d3sparql.tree.TreeConfig;
  import TreeMapConfig = d3sparql.tree.TreeMapConfig;
  /**
   * The current version of D3.js.
   */
  export var version: string;

  export var debug: boolean;

  export function treemap(json: SparqlResults, config?: TreeConfig & TreeMapConfig);

  interface SparqlResults {
    head: {
      links?: object[];
      vars?: string[];
    };
    results: {
      bindings: object[];
    }
  }

  export type Selector = string | EventTarget | null;

  namespace tree {
    interface TreeConfig {
      root?: string;
      parent?: string;
      child?: string;
      value?: string;
    }

    interface TreeMapConfig {
      width?: number;
      height?: number;
      count?: number;
      color?: (name: string) => string;
      margin?: { top: number, right: number, bottom: number, left: number };
      selector?: Selector
    }
  }
}
