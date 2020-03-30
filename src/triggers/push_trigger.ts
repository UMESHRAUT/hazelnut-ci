import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { getConfig, sendMail } from "../utils";
import { BuildInfo } from "../models";

export async function pushTrigger(
  context: Context<Webhooks.WebhookPayloadPush>,
  db: PouchDB.Database
) {
  const { error, entryPoint, config } = await getConfig(context)!;

  const {
    repository: {
      name,
      full_name,
      owner: { login, email },
      owner
    },
    after
  } = context.payload;

  if (error) {
    await sendMail(
      email!,
      "Project Build terminated",
      `Hi ${login}, \n Your build for project: ${name} is terminated  due to an error\n ${error}\n\n Regards, \nHazelnut-CI team`
    );

    return;
  }

  const rootPath = `./repositories/${full_name}_${after}`;

  const startTime = new Date();

  const doc: BuildInfo = {
    _id: after,
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
    name: "Integration",
    owner: login,
    repo: name,
    head_sha: after
  });
}
