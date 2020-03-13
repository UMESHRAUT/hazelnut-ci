import { HNDocker } from "./HNDocker";

/**
 * Executors define the environment in which the steps of a job will be run,
 * allowing you to reuse a single executor definition across multiple jobs.
 */
export interface HNExecutor {
  /**
   * Options for docker executor
   */
  docker: string | HNDocker;

  /**
   * In which directory to run the steps.
   */
  working_directory: string;

  /**
   * A map of environment variable names and values.
   */
  environment: { [x: string]: any };
}
