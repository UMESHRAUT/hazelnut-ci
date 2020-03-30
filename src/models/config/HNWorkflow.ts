/**
 * Used for orchestrating all jobs. Each workflow consists of the workflow name
 * as a key and a map as a value. A name should be unique within the current config.yml.
 * The top-level keys for the Workflows configuration are version and jobs
 */

/**
 * A job can have the keys requires, context, type, and filters.
 */
export interface HNWorkflowJob {
  jobs: [{ [x: string]: HNWorkflowJobItem }];
}

export interface HNWorkflowJobItem {
  /**
   * A list of jobs that must succeed for the job to start
   */
  requires: Array<string>;

  /**
   * Filters can have the key branches or tags. Note Workflows will ignore job-
   * level branching. If you use job-level branching and later add workflows,
   * you must remove the branching at the job level and instead declare it
   * in the workflows section of your hazelnut.yml.
   */
  filters: {
    /**
     * A map defining rules for execution on specific branches
     */
    branches: {
      /**
       * Either a single branch specifier, or a list of branch specifiers
       */
      only: string | Array<string>;

      /**
       * Either a single branch specifier, or a list of branch specifiers
       */
      ignore: string | Array<string>;
    };
  };
}
