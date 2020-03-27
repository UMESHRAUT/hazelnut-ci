import { Application } from "probot";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import Docker from "dockerode";
import { pushTrigger, checkRunRerequested, checkRunCreated } from "./triggers";

const docker = new Docker();

PouchDB.plugin(PouchDBFind);
const db = new PouchDB("local");

// TODO: Figure out the structure of the database
export = (app: Application) => {
  app.on("push", context => pushTrigger(context, db));

  app.on("check_run.rerequested", context => checkRunRerequested(context, db));

  app.on("check_run.created", context => checkRunCreated(context, db, docker));
};
