import { Application } from "probot";
import { HNConfig } from "./models";
import { HNDefaultConfig } from "./configs";

export = (app: Application) => {
  app.log("Yay, the app was loaded!");

  app.on("issues.opened", async context => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!"
    });

    context.github.issues.createComment(issueComment);
  });

  app.on(
    [
      "push",
      "pull_request.opened",
      "pull_request.reopend",
      "pull_request.edited"
    ],
    async context => {
      app.log(
        `Pushed changes to ${context.payload.repository.name} | before: ${context.payload.before} | after: ${context.payload.after}`
      );

      const config = (await context.config(
        "hazelnut.yml",
        HNDefaultConfig
      )) as HNConfig;
    }
  );
};
