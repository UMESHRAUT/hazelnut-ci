import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { cloneRepository, removeRepository } from "../utils";
import { BuildInfo } from "../models";
import Docker from "dockerode";

export async function checkRunCreated(
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  db: PouchDB.Database,
  docker: Docker
) {
  const {
    repository: {
      name,
      owner: { login }
    },
    check_run: { id, head_sha }
  } = context.payload;

  const doc = (await db.get(head_sha)) as BuildInfo;

  const started_at = new Date(doc.startTime).toISOString();

  // Update the Check to status "in_progress"
  await context.github.checks.update({
    owner: login,
    repo: name,
    check_run_id: id,
    status: "in_progress",
    started_at
  });

  // clone the repository
  await cloneRepository(doc.repoPath, context);

  // * Based on the active flow run a check and select build flow.
  if (doc.entryPoint === "workflows") {
  } else if (doc.entryPoint === "build") {
  }

  await removeRepository(doc.repoPath, 1000);
}
