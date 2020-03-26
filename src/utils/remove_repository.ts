import fs from "fs";

export async function removeRepository(repoPath: string, waitDuration: number) {
  setTimeout(async () => {
    await fs.promises.rmdir(repoPath, { recursive: true });
  }, waitDuration);
}
