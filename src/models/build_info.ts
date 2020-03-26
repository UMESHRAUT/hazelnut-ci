import { HNConfig } from "./config";

export interface BuildInfo {
  _id: string;

  entryPoint: string;

  config?: HNConfig;

  completed: boolean;

  error?: string;

  startTime: Date;

  endTime?: Date;

  totalExecutionTime?: number;

  repoPath: string;

  workflowOutput: Array<Output>;

  jobOutput: Array<Output>;
}

interface Output {
  type: "workflow" | "job";

  name: string;

  message: string;

  error?: string;

  runnig: boolean;

  completed: boolean;
}
