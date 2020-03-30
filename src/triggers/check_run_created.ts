import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { cloneRepository, removeRepository, sendMail } from "../utils";
import { BuildInfo } from "../models";
import { runJob } from "../utils";

export async function checkRunCreated(
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  db: PouchDB.Database
) {
  const {
    repository: {
      name,
      owner: { login, email }
    },
    check_run: {
      id,
      head_sha,
      check_suite: { head_branch }
    }
  } = context.payload;

  const doc = (await db.get(head_sha)) as BuildInfo;

  const started_at = new Date(doc.startTime).toISOString();

  await sendMail(
    email!,
    "Project Build started",
    `Hi ${login}, \n Your build for project: ${name} has started at : ${started_at} we will keep you updated\n\n Regards, \nHazelnut-CI team`
  );

  // Update the Check to status "in_progress"
  await context.github.checks.update({
    owner: login,
    repo: name,
    check_run_id: id,
    status: "in_progress",
    started_at
  });

  try {
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

            await runJob(job, doc);
          }
        }
      }
    } else if (doc.entryPoint === "build") {
      await runJob(doc.entryPoint, doc);
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

    await sendMail(
      email!,
      "Project Build Completed Successfully",
      `Hi ${login}, \n Your build for project: ${name} completed sucessfully  at : ${completed_at} \n\n Regards, \nHazelnut-CI team`
    );
  } catch (e) {
    console.error(e.stderr);

    await sendMail(
      email!,
      "Project Build terminated",
      `Hi ${login}, \n Your build for project: ${name} is terminated at : ${started_at} due to an error\n ${e}\n\n Regards, \nHazelnut-CI team`
    );

    const completed_at = new Date().toISOString();

    await context.github.checks.update({
      owner: login,
      repo: name,
      check_run_id: id,
      status: "completed",
      started_at,
      completed_at,
      conclusion: "failure"
    });
  }

  await removeRepository(doc.repoPath, 2000);
}
