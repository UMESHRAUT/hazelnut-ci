/**
 * Configured by docker key which takes a list of maps:
 */
export interface HNDocker {
  /**
   * 	The name of a custom docker image to use
   */
  image: string;

  /**
   * The command used as executable when launching the container
   */
  entrypoint: string | Array<String>;

  /**
   * The command used as pid 1 (or args for entrypoint) when launching the container
   */
  command: string | Array<String>;

  /**
   * A map of environment variable names and values
   */
  environment: { [x: string]: any };
}
