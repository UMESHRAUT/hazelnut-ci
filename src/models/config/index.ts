import { HNWorkflowJob } from "./HNWorkflow";
import { HNJob } from "./HNJob";
import { HNExecutor } from "./HNExecutor";
import { HNCommand } from "./HNCommand";

export interface HNConfig {
  /**
   * The `version` field is intended to be used in order to issue warnings for
   * deprecation or breaking changes.
   */
  version: 1;

  /**
   * Should the hazelnut-ci run the files
   */
  active: boolean;

  /**
   * Name of the project or app that you are building.
   */
  name: string;

  /**
   * Description of the project or app.
   */
  description?: string;

  /**
   * A command definition defines a sequence of steps as a map to be executed in a job,
   * enabling you to reuse a single command definition across multiple jobs.
   *
   * Example:
   * ```yaml
   * commands:
      sayhello:
      description: "A very simple command for demonstration purposes"
      parameters:
        to:
          type: string
          default: "Hello World"
     steps:
      - run: echo << parameters.to >>
   * ```
   */
  commands?: { [x: string]: HNCommand };

  /**
   * A job comprised of a commands that need to be executed to execute the
   * pipeline. The name of the job is the key in the map, and the value is a
   * map describing the job.
   *
   * If you are using Workflows, jobs must have unique names within the
   * `.github/hazelnut.yml` file.
   *
   * If you are not using workflows, the jobs map must contain a job named build.
   * This build job is the default entry-point for a run that is triggered by a
   * push to your VCS provider.
   *
   * Example:
   * ```yaml
   * jobs:
      build:
        docker:
          - image: buildpack-deps:trusty
        environment:
          FOO: bar
        working_directory: ~/my-app
        steps:
          - run: go test -v $(go list ./... | circleci tests split
   * ```
   */
  jobs: { [x: string]: HNJob };

  /**
   * Used for orchestrating all jobs. Each workflow consists of the workflow name as
   * a key and a map as a value. A name should be unique within the current config.yml.
   * The top-level keys for the Workflows configuration are version and jobs.
   */
  workflows?: { [x: string]: HNWorkflowJob };

  /**
   * Executors define the environment in which the steps of a job will be run,
   * allowing you to reuse a single executor definition across multiple jobs.
   *
   * Example:
   * ```yaml
   * version: 2.1
      executors:
        my-executor:
          docker:
            - image: circleci/ruby:2.5.1-node-browsers

      jobs:
        my-job:
          executor: my-executor
          steps:
            - run: echo outside the executor
   * ```
   */
  executors?: HNExecutor;
}
