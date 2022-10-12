import { Probot } from "probot";
import { appConfig } from "./config";
import { createCommitEventSplunk, postToSplunk } from "./splunk";

export = (app: Probot) => {
  app.on("pull_request.closed", async (context) => {
    if (
      context.payload.pull_request.merged &&
      context.payload.pull_request.base.ref ===
        context.payload.repository.default_branch &&
      context.payload.repository.owner.login === appConfig.githubOrg
    ) {
      const params = {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: context.payload.pull_request.number,
      };

      const commits = await context.octokit.pulls.listCommits(params);

      if (commits.status == 200) {
        const splunkEvent = createCommitEventSplunk(
          context.payload.pull_request,
          commits.data
        );

        if (appConfig.dryRun) {
          const dryRunMsg = `Running in dry run mode. Not sending data to Splunk. Would have sent the following: \n${JSON.stringify(
            splunkEvent
          )}`;
          app.log.info(dryRunMsg);
        } else {
          postToSplunk(splunkEvent, app);
        }
      }
    }
  });
};
