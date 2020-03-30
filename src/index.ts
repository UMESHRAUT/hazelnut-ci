import { Application } from "probot";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import {
  pushTrigger,
  checkRunRerequested,
  checkRunCreated,
  pullRequest
} from "./triggers";

PouchDB.plugin(PouchDBFind);
const db = new PouchDB("local");

export = (app: Application) => {
  app.on("push", context => pushTrigger(context, db));

  app.on(["pull_request.reopened", "pull_request.opened"], context =>
    pullRequest(context, db)
  );

  app.on("check_run.rerequested", context => checkRunRerequested(context, db));

  app.on("check_run.created", context => checkRunCreated(context, db));
};
