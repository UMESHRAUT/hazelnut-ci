import { Application, Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { getConfig, cloneRepository, removeRepository } from "./utils";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
// import { HeadCommit } from "./models";
// import uuid from "uuid/v4";

PouchDB.plugin(PouchDBFind);
// const db = new PouchDB("local");

// TODO: Figure out the structure of the database
export = (app: Application) => {
  // * 1. make new entry in the database using uuidv4
  // * 2. initialize the first check based on the steps mentioned in the config
  // * 3. Persist the check id in the database to later update the checks
  app.on("push", async (context: Context<Webhooks.WebhookPayloadPush>) => {
    const { error } = await getConfig(context, app)!;

    // * If there is an error close imediately adn notify the User
    // * Email or any other method
    if (error) {
      return;
    }

    const {
      repository: {
        name,
        owner: { login }
      },
      after
    } = context.payload;

    await context.github.checks.create({
      name: "Integration",
      owner: login,
      repo: name,
      head_sha: after
    });
  });

  app.on(
    "check_run.rerequested",
    async (context: Context<Webhooks.WebhookPayloadCheckRun>) => {
      const { error } = await getConfig(context, app)!;

      // * If there is an error close imediately adn notify the User
      // * Email or any other method
      if (error) {
        return;
      }

      const {
        repository: {
          name,
          owner: { login }
        },
        check_run: { head_sha = "" }
      } = context.payload;

      await context.github.checks.create({
        name: "Default Name",
        owner: login,
        repo: name,
        head_sha
      });
    }
  );

  // * 1. Run the current step & update the checks
  // * 2. Once the step is complete update the check based on failure or success
  // * 3. If success trigger `check_run.completed` else
  app.on(
    "check_run.created",
    async (context: Context<Webhooks.WebhookPayloadCheckRun>) => {
      const { entrypoint, error } = await getConfig(context, app)!;

      // * If there is an error close imediately adn notify the User
      // * Email or any other method
      if (error) {
        return;
      }

      const {
        repository: {
          name,
          full_name,
          owner: { login }
        },
        check_run: { id, head_sha }
      } = context.payload;

      const startTime = new Date();

      const rootPath = `./repositories/${full_name}_${head_sha}`;

      app.log("repoOwner:", login);
      app.log("repoName:", name);
      app.log("CheckRun:", id);

      app.log(
        "GitHub API Update Check with start time: ",
        startTime.toISOString()
      );

      // Update the Check to status "in_progress"
      await context.github.checks.update({
        owner: login,
        repo: name,
        check_run_id: id,
        status: "in_progress",
        started_at: startTime.toISOString()
      });

      // clone the repository
      await cloneRepository(rootPath, context);

      // * Based on the active flow run a check and select build flow.
      if (entrypoint === "workflows") {
      } else if (entrypoint === "build") {
      }

      await removeRepository(rootPath, 1000);
    }
  );
};
