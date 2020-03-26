import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import fs from "fs";

/**
 * Clones the repository recursivly.
 *
 * @param context - Gets the default passed context from the root application.
 */
export async function cloneRepository(
  context: Context<Webhooks.WebhookPayloadCheckRun>
) {
  // Gets all the necessary info from `context.payload`
  const {
    repository: {
      full_name,
      owner: { login },
      name
    },
    check_run: {
      check_suite: { head_branch, head_sha }
    }
  } = context.payload;

  // Root directory where everything will live its a combination of repository
  // full_name: "username/repository_name" & commit_id
  const rootPath = `./repositories/${full_name}_${head_sha}`;

  await fs.promises.mkdir(rootPath, {
    recursive: true
  });

  // Get the contents of the directory
  const rootResponse = await context.github.repos.getContents({
    owner: login,
    repo: name,
    path: ".",
    ref: head_branch
  });

  const rootFiles = rootResponse.data as Array<any>;

  // Recursvivly fetch & write the files to the local machine,
  fetchAndClone(context, rootPath, head_branch, login, name, rootFiles);
}

async function fetchAndClone(
  context: Context<Webhooks.WebhookPayloadCheckRun>,
  rootPath: string,
  head_branch: string,
  owner: string,
  repo: string,
  files: Array<any>
) {
  for (const file of files) {
    if (file.type === "dir") {
      const dirPath = file.path;

      await fs.promises.mkdir(`${rootPath}/${dirPath}`, {
        recursive: true
      });

      const rootResponse = await context.github.repos.getContents({
        owner,
        repo,
        path: dirPath,
        ref: head_branch
      });

      const rootFiles = rootResponse.data as Array<any>;

      fetchAndClone(context, rootPath, head_branch, owner, repo, rootFiles);
    } else if (file.type === "file") {
      const filePath = file.path;

      // Get the files raw data from Github
      const blobContent = await context.github.git.getBlob({
        owner,
        repo,
        file_sha: file.sha
      });

      const rawData = blobContent.data.content;

      // Create Buffer from base64 string.
      const fileContent = Buffer.from(rawData, "base64").toString();

      // Write it to the local system.
      await fs.promises.writeFile(`${rootPath}/${filePath}`, fileContent);
    }
  }
}
