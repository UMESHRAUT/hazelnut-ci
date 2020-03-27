import { Application, Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { getConfig, cloneRepository, removeRepository } from "./utils";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
// import Docker from "dockerode";
import { BuildInfo } from "./models";
// import uuid from "uuid/v4";

// const docker = new Docker();

PouchDB.plugin(PouchDBFind);
const db = new PouchDB("local");

// TODO: Figure out the structure of the database
export = (app: Application) => {
  // * 1. make new entry in the database using uuidv4
  // * 2. initialize the first check based on the steps mentioned in the config
  // * 3. Persist the check id in the database to later update the checks
  app.on("push", async (context: Context<Webhooks.WebhookPayloadPush>) => {
    const { error, entryPoint, config } = await getConfig(context, app)!;

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
      after
    } = context.payload;

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
  });

  app.on(
    "check_run.rerequested",
    async (context: Context<Webhooks.WebhookPayloadCheckRun>) => {
      const { error, entryPoint, config } = await getConfig(context, app)!;

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
  );

  // * 1. Run the current step & update the checks
  // * 2. Once the step is complete update the check based on failure or success
  // * 3. If success trigger `check_run.completed` else
  app.on(
    "check_run.created",
    async (context: Context<Webhooks.WebhookPayloadCheckRun>) => {
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
  );
};
