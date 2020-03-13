import { HNRun } from "./HNRun";

/**
 * The steps setting in a job should be a list of single key/value pairs,
 * the key of which indicates the step type. The value may be either a
 * configuration map or a string (depending on what that type of step requires).
 *
 * Example:
 * ```yaml
 *  jobs:
      build:
        working_directory: ~/canary-python
        environment:
          FOO: bar
        steps:
          - run:
              name: Running tests
              command: make test
          - run: make test
 * ```
 */
export interface HNStep {
  /**
   * Used for invoking all command-line programs, taking either a map of configuration
   * values, or, when called in its short-form, a string that will be used as both the
   * command and name. Run commands are executed using non-login shells by default,
   * so you must explicitly source any dotfiles as part of the command.
   */
  run: string | HNRun;
}
