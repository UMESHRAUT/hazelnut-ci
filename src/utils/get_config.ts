import { Context, Application } from "probot";
import { HNDefaultConfig } from "../configs";
import { HNConfig } from "../models";
import Webhooks from "@octokit/webhooks";

const CONFIG_FILENAME = "hazelnut.yml";

interface GetConfigResult {
  config?: HNConfig;

  error?: string;

  entrypoint?: "workflows" | "build" | "no_entry";
}

export async function getConfig(
  context: Context<
    | Webhooks.WebhookPayloadPush
    | Webhooks.WebhookPayloadPullRequest
    | Webhooks.WebhookPayloadCheckRun
  >,
  app: Application
): Promise<GetConfigResult> {
  let result: GetConfigResult = { entrypoint: "no_entry" };

  const { name } = context.payload.repository;

  const config = (await context.config(
    CONFIG_FILENAME,
    HNDefaultConfig
  )) as HNConfig;

  result.config = config;

  // * Notify user that there are no config files in the project
  if (!config) {
    // TODO: Notify user
    app.log(`Hazelnut CI is not configured for ${name}`);

    result.error = "No config found";

    return result;
  }

  // * Check to see if hazelnut-ci is active or not
  if (!config.active) {
    app.log(`Hazelnut CI is disabled for ${name}`);

    result.error = "Hazelnut CI is not active";

    return result;
  }

  // * Check if the workflow is empty
  if (!config!.workflows) {
    // * If workflow is empty then check if there is a job called "build"
    // * If not notify the user. and close the loop.
    if (!config!.jobs["build"]) {
      // TODO: Notify that the config file does not contain an entry point
      app.log(
        `Hazelnut CI did not find any entry point no 'workflows' or a job name 'build': ${name}`
      );

      result.error =
        "Did not find any entry point to 'workflows' or a job name 'build'";

      return result;
    }

    // TODO: keep track of active flow
    // * Notify the user that build has started and update the entry build for the project
    // * is "workflow" || "build".

    result.entrypoint = "build";

    return result;
  }

  result.entrypoint = "workflows";

  return result;
}
