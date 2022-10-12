export const appConfig = {
  githubOrg: process.env.GITHUB_ORG,
  dryRun: process.env.DRY_RUN,
  SplunkConnectionString: {
    url: process.env.SPLUNK_URL,
    splunkToken: process.env.SPLUNK_TOKEN,
  },
};

export function getConfig() {
  return appConfig;
}
