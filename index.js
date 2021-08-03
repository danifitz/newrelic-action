const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');

try {
  // get the New Relic region and account ID
  const region = core.getInput('region');
  const accountId = core.getInput('account-id');
  const insertKey = core.getInput('insert-key');

  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  const context = JSON.stringify(github.context, undefined, 2);
  // console.log(`The context: ${context}`);
  
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);

  const eventType = core.getInput('event-name');
  const nrEvent = {
    // set the new relic event type
    eventType: eventType,
    // other data points
    event: context.eventName,
    sha: context.sha,
    ref: context.ref,
    workflow: context.workflow,
    action: context.action,
    actor: context.actor,
    job: context.job,
    runNumber: context.runNumber,
    runId: context.runId,
    pusherEmail: payload.pusher.email,
    pusherName: payload.pusher.name,
    repositoryUrl: payload.repository.url,
    commitAuthorEmail: payload.head_commit.author.email,
    commitAuthorName: payload.head_commit.author.name,
    commitAuthorUsername: payload.head_commit.author.username,
    commitCommitterEmail: payload.head_commit.committer.email,
    commitCommitterName: payload.head_commit.committer.name,
    commitCommitterUsername: payload.head_commit.committer.username,
    commitId: payload.head_commit.id,
    commitMessage: payload.head_commit.message,
    commitUrl: payload.head_commit.url
    // TODO: add commit timestamp - convert 2021-08-02T16:31:18+01:00 to unix epoch
  }

  sendToNewRelic(region, accountId, insertKey, nrEvent);

} catch (error) {
  core.setFailed(error.message);
}

const sendToNewRelic = (region, accountId, insertKey, event) => {
  const data = new TextEncoder().encode(JSON.stringify(event));
  
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
    console.log(`POST to New Relic statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      process.stdout.write(d)
    })
  })
  
  req.on('error', error => {
    console.error(error)
  })
  
  req.write(data)
  req.end()
}
