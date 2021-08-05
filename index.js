const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');

const sendToNewRelic = (region, accountId, insertKey, event) => {
  const data = JSON.stringify(event);
  
  // set the correct URL for Event API depending on region
  const nrUrl = region == 'EU' ? 'insights-collector.eu01.nr-data.net': 'insights-collector.newrelic.com';

  const options = {
    hostname: nrUrl,
    port: 443,
    path: `/v1/accounts/${accountId}/events`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'X-Insert-Key': insertKey
    }
  }
  
  const req = https.request(options, res => {
    core.info(`POST to ${nrUrl} statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      core.info(`Finished POST to ${nrUrl} with result ${d.toString()}`);
    })
  })
  
  req.on('error', error => {
    core.error(error)
  })
  
  req.write(data)
  req.end()
}

try {
  // get the region, account ID, api key and eventType for sending to New Relic
  const region = core.getInput('region');
  const accountId = core.getInput('account-id');
  const insertKey = core.getInput('insert-key');
  const eventType = core.getInput('event-name');

  const nrEvent = {
    // set the new relic event type
    eventType: eventType,
    // other data points
    event: github.context.eventName,
    sha: github.context.sha,
    ref: github.context.ref,
    workflow: github.context.workflow,
    action: github.context.action,
    actor: github.context.actor,
    job: github.context.job,
    runNumber: github.context.runNumber,
    runId: github.context.runId,
    pusherEmail: github.context.payload.pusher.email,
    pusherName: github.context.payload.pusher.name,
    repositoryUrl: github.context.payload.repository.url,
    commitAuthorEmail: github.context.payload.head_commit.author.email,
    commitAuthorName: github.context.payload.head_commit.author.name,
    commitAuthorUsername: github.context.payload.head_commit.author.username,
    commitCommitterEmail: github.context.payload.head_commit.committer.email,
    commitCommitterName: github.context.payload.head_commit.committer.name,
    commitCommitterUsername: github.context.payload.head_commit.committer.username,
    commitId: github.context.payload.head_commit.id,
    commitMessage: github.context.payload.head_commit.message,
    commitUrl: github.context.payload.head_commit.url
    // TODO: add commit timestamp - convert 2021-08-02T16:31:18+01:00 to unix epoch
  }

  sendToNewRelic(region, accountId, insertKey, nrEvent);

} catch (error) {
  core.setFailed(error.message);
}
