import { PullRequestClosedEvent } from '@octokit/webhooks-types'

import { Client } from 'src/misc/types'
import { getUserAndConversation } from '../misc/utils'

export const firePullRequesMerged = async ({
  githubEvent,
  client,
}: {
  githubEvent: PullRequestClosedEvent
  client: Client
}) => {
  await client.createEvent({
    type: 'pullRequestMerged',
    payload: {
      id: githubEvent.pull_request.id,
      content: githubEvent.pull_request.body ?? '',
      title: githubEvent.pull_request.title,
      baseBranch: githubEvent.pull_request.base.ref,
      targets: {
        pullRequest: githubEvent.pull_request.number.toString(),
      },
      ...(await getUserAndConversation(
        {
          githubUserId: githubEvent.pull_request.user.id,
          githubChannelId: githubEvent.pull_request.number,
          githubChannel: 'pullRequest',
        },
        client
      )),
    },
  })
}
