import { dockerCommand } from "docker-cli-js";
import { HNJob } from "../models/config/HNJob";
import { HNRun } from "../models/config/HNRun";
import { BuildInfo } from "../models";
import { spawn } from "child_process";

export async function runJob(jobName: string, doc: BuildInfo) {
  const build = doc.config?.jobs[jobName] as HNJob;

  const dockerImage = build.docker;

  const image =
    typeof dockerImage === "string" ? dockerImage : dockerImage.image;

  await dockerCommand(`image pull ${image}`);

  let environmentVariables: string = "";

  for (const env of Object.keys(build.environment)) {
    environmentVariables += `-e ${env}='${build.environment[env]}' \ `;
  }

  const containerResponse = await dockerCommand(
    `run ${environmentVariables} -dt ${image}`
  );

  await dockerCommand(
    `container exec ${containerResponse.containerId} sh -c 'echo "$FIREBASE_DEPLOY_TOKEN"'`
  );

  const cleanWorkDirectory = build.working_directory.replace("~/", "");

  await dockerCommand(
    `exec -i ${containerResponse.containerId} mkdir ${cleanWorkDirectory}`
  );

  await spawn(`docker`, [
    "cp",
    "-a",
    `${doc.repoPath}/.`,
    `${containerResponse.containerId}:${cleanWorkDirectory}`,
  ]);

  await setTimeout(() => {}, 2000);

  await dockerCommand(
    `container exec ${containerResponse.containerId} sh -c "ls -al ${cleanWorkDirectory}/public"`
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
}
