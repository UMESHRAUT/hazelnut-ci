import { HNStep } from "./HNStep";

/**
 * A command definition defines a sequence of steps as a map to be executed
 * in a job, enabling you to reuse a single command definition across multiple jobs.
 */
export interface HNCommand {
  /**
   * Description of the command, usually 180 characters long
   */
  description: string;

  /**
   * A sequence of steps run inside the calling job of the command.
   */
  steps: Array<HNStep>;

  /**
   * 	A map of parameter keys. See the Parameter Syntax section of the
   * Reusing Config document for details.
   */
  parameters: { [x: string]: HNParameter };
}
