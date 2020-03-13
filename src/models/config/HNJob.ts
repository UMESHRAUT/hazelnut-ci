import { HNStep } from "./HNStep";
import { HNDocker } from "./HNDocker";

/**
 * A run is comprised of one or more named jobs. Jobs are specified in the jobs map,
 * The name of the job is the key in the map, and the value is a map describing the job.
 *
 * If you are not using workflows, the jobs map must contain a job named build.
 * This build job is the default entry-point for a run that is triggered by a
 * push to your VCS provider. It is possible to then specify additional jobs and
 * run them using the CircleCI API.
 */
export interface HNJob {
  /**
   * Options for docker executor
   */
  docker: string | HNDocker;

  /**
   * In which directory to run the steps. Default: ~/project
   * (where project is a literal string, not the name of your specific project)
   */
  working_directory: string;

  /**
   * A list of steps to be performed
   */
  steps: Array<HNStep>;

  /**
   * A map of parameters that need to be passed as part of the request
   * when performing this operation
   */
  parameters: { [x: string]: HNParameter };

  /**
   * A map of environment variable names and values.
   */
  environment: { [x: string]: any };
}
