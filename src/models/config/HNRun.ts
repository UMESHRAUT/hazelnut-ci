/**
 * Used for invoking all command-line programs, taking either a map of configuration
 * values, or, when called in its short-form, a string that will be used as both the
 * command and name. Run commands are executed using non-login shells by default,
 * so you must explicitly source any dotfiles as part of the command.
 */
export interface HNRun {
  /**
   * Title of the step to be shown in the CircleCI UI (default: full command)
   */
  name: string;

  /**
   * Command to run via the shell
   */
  command: string;

  /**
   * Whether or not this step should run in the background (default: false)
   */
  background: boolean;

  /**
   * Title of the step to be shown in the CircleCI UI (default: full command)
   */
  environment: { [x: string]: any };

  /**
   * In which directory to run this step (default: working_directory of the job)
   */
  working_directory: string;

  /**
   * 	Elapsed time the command can run without output. The string is a decimal
   * with unit suffix, such as “20m”, “1.25h”, “5s” (default: 10 minutes)
   */
  no_output_timeout: string;

  /**
   * Specify when to enable or disable the step. Takes the following
   * values: always, on_success, on_fail (default: on_success)
   */
  when: "always" | "on_sucess" | "on_fail";
}
