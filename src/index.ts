import { Application } from "probot";

export = (app: Application) => {
  app.log("Yay, the app was loaded!");

  app.on("issues.opened", async context => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!"
    });

    context.github.issues.createComment(issueComment);
  });

  app.on("push", async context => {
    app.log("Pushed changes");

    try {
      const repo = context.repo();

      const content = await context.github.git.getRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: "heads/master"
      });

      app.log(content.data);
    } catch (e) {
      app.log(e);
    }
  });
};
