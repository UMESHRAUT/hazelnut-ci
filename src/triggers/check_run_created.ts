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
    check_run: {
      id,
      head_sha,
      check_suite: { head_branch }
    }
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
    const workflows = doc.config?.workflows!;

    for (const workflow of Object.keys(workflows)) {
      const jobs = workflows[workflow].jobs;

      for (const jobIndex of jobs) {
        for (const job of Object.keys(jobIndex)) {
          const finalJob = jobIndex[job];

          const ignoreBranch = finalJob.filters.branches.ignore;

          const onlyBranch = finalJob.filters.branches.only;

          if (
            (typeof ignoreBranch === "string" &&
              ignoreBranch === head_branch) ||
            (typeof ignoreBranch === "object" &&
              ignoreBranch.includes(head_branch))
          ) {
            continue;
          }

          if (
            (typeof onlyBranch === "string" && onlyBranch !== head_branch) ||
            (typeof onlyBranch === "object" &&
              !onlyBranch.includes(head_branch))
          ) {
            continue;
          }

          await runJob(job, doc, context, started_at, login, name, id);
        }
      }
    }
  } else if (doc.entryPoint === "build") {
    await runJob(doc.entryPoint, doc, context, started_at, login, name, id);
  }

  const completed_at = new Date().toISOString();

  await context.github.checks.update({
    owner: login,
    repo: name,
    check_run_id: id,
    status: "completed",
    started_at,
    completed_at,
    conclusion: "success"
  });

  await removeRepository(doc.repoPath, 2000);

  // TODO: Notify sucess. Update the Check-run to complete
}

async function runJob(
  jobName: string,
  doc: BuildInfo,
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  started_at: string,
  ownerName: string,
  repoName: string,
  checkRunId: number
) {
  const build = doc.config?.jobs[jobName] as HNJob;

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

    const completed_at = new Date().toISOString();

    await context.github.checks.update({
      owner: ownerName,
      repo: repoName,
      check_run_id: checkRunId,
      status: "completed",
      started_at,
      completed_at,
      conclusion: "failure"
    });

    //TODO: Notify of failure
  }
}
