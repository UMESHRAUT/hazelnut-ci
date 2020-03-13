type HNParameterType = "string" | "number" | "boolean" | "object" | "array";

/**
 * Pipeline parameters declared for use in the configuration.
 */
interface HNParameter {
  /**
   * Required. See Parameter Types in the section below for details.
   */
  type: HNParameterType;

  /**
   * The default value for the parameter. If not present, the parameter
   * is implied to be required.
   */
  default: any;

  /**
   * Description of the parameter.
   */
  description: string;
}
