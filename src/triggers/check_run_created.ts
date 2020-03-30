import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { cloneRepository, removeRepository } from "../utils";
import { BuildInfo } from "../models";
// import Docker from "dockerode";
import { dockerCommand } from "docker-cli-js";
import { HNJob } from "../models/config/HNJob";
import { HNRun } from "../models/config/HNRun";

export async function checkRunCreated(
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  db: PouchDB.Database
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
    const build = doc.config?.jobs["build"] as HNJob;

    const dockerImage = build.docker;

    const image =
      typeof dockerImage === "string" ? dockerImage : dockerImage.image;

    try {
      await dockerCommand(`image pull ${image}`);

      let environmentVariables: string = "";

      for (const env of Object.keys(build.environment)) {
        environmentVariables += `${env}=${build.environment[env]} `;
      }

      const containerResponse = await dockerCommand(
        `container run -e ${environmentVariables} -dt ${image}`
      );

      const cleanWorkDirectory = build.working_directory.replace("~/", "");

      await dockerCommand(
        `exec -i ${containerResponse.containerId} mkdir ${cleanWorkDirectory}`
      );

      await dockerCommand(
        `cp ${doc.repoPath}/. ${containerResponse.containerId}:${cleanWorkDirectory}`
      );

      await dockerCommand(
        `container exec ${containerResponse.containerId} sh -c "cd ${cleanWorkDirectory}/src ; ls -al"`
      );

      for (const step of build.steps) {
        if (typeof step === "string") {
          const run = step!.run as string;

          await dockerCommand(
            `container exec ${containerResponse.containerId} sh -c "cd ${cleanWorkDirectory} ; ${run}"`
          );
        } else {
          const run = step.run as HNRun;

          await dockerCommand(
            `container exec ${containerResponse.containerId} sh -c "cd ${cleanWorkDirectory} ; ${run.command}"`
          );
        }
      }

      await dockerCommand(
        `container exec ${containerResponse.containerId} sh -c "cd ${cleanWorkDirectory}/build ; ls -al"`
      );

      await dockerCommand(`container stop ${containerResponse.containerId}`);

      await dockerCommand(`container rm ${containerResponse.containerId}`);
    } catch (e) {
      console.error(e.stderr);

      //TODO: Notify of failure
    }
  }

  await removeRepository(doc.repoPath, 2000);

  // TODO: Notify sucess. Update the Check-run to complete
}
