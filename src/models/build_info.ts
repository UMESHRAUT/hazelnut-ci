import { HNConfig } from "./config";
import Webhooks from "@octokit/webhooks";

export type EntryPoint = "workflows" | "build" | "no_entry";

export interface BuildInfo {
  _id: string;

  entryPoint?: EntryPoint;

  config?: HNConfig;

  completed: boolean;

  error?: string;

  startTime: Date;

  endTime?: Date;

  totalExecutionTime?: number;

  repoPath: string;

  workflowOutput: Array<Output>;

  jobOutput: Array<Output>;

  user: Webhooks.PayloadRepositoryOwner;
}

interface Output {
  type: "workflow" | "job";

  name: string;

  message: string;

  error?: string;

  runnig: boolean;

  completed: boolean;
}
