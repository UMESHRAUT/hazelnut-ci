import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { getConfig } from "../utils";
import { BuildInfo } from "../models";

export async function checkRunRerequested(
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  db: PouchDB.Database
) {
  const { error, entryPoint, config } = await getConfig(context)!;

  // * If there is an error close imediately adn notify the User
  // * Email or any other method
  if (error) {
    return;
  }

  const {
    repository: {
      name,
      full_name,
      owner: { login },
      owner
    },
    check_run: { head_sha }
  } = context.payload;

  const rootPath = `./repositories/${full_name}_${head_sha}`;

  const startTime = new Date();

  const doc: BuildInfo = {
    _id: head_sha,
    entryPoint,
    completed: false,
    config,
    user: owner,
    workflowOutput: [],
    jobOutput: [],
    repoPath: rootPath,
    startTime
  };

  db.put(doc);

  await context.github.checks.create({
    name: "Default Name",
    owner: login,
    repo: name,
    head_sha
  });
}
