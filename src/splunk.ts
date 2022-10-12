import { Probot } from "probot";
import { PullRequest } from "@octokit/webhooks-types";
import { getConfig } from "./config";
import axios from "axios";

export function createCommitEventSplunk(
  pull_request: PullRequest & {
    state: "closed";
    closed_at: string;
    merged: boolean;
  },
  commits: any[]
) {
  const commitsList = [];

  for (var commit in commits) {
    commitsList.push({
      sha: commits[commit].sha,
      date: commits[commit].commit.author.date,
    });
  }

  return {
    index: "hm_devops_dora",
    source: "github",
    sourcetype: "pull_request_merged",
    event: {
      createdAt: pull_request.created_at,
      mergedAt: pull_request.merged_at,
      closedAt: pull_request.closed_at,
      organization: pull_request.base.repo.owner.login,
      repositoryName: pull_request.base.repo.name,
      fullRepositoryName: pull_request.base.repo.full_name,
      headBranch: pull_request.head.ref,
      baseBranch: pull_request.base.ref,
      mergeCommit: pull_request.merge_commit_sha,
      headCommit: pull_request.head.sha,
      commits: commitsList,
      numberCommits: pull_request.commits,
    },
  };
}

export async function postToSplunk(splunkEvent: any, app: Probot) {
  const config = getConfig();
  try {
    const splankUrl = config.SplunkConnectionString.url;
    if (!splankUrl) throw Error("spank cannot be empry");

    const resp = await axios.post(splankUrl, splunkEvent, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Splunk ${config.SplunkConnectionString.splunkToken}`,
      },
    });

    if (resp.status !== 200) {
      let err = new Error(
        `post to splunk failed with status ${resp.status} \n ${resp.statusText}`
      );
      throw err;
    }

    app.log.info(
      `Forwarded request to Splunk HEC. Response status code: ${resp.status}`
    );
  } catch (err) {
    app.log.error(`Error sending data to Splunk HEC. Error: ${err}`);
  }
}
