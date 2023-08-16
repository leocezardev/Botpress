import { z } from 'zod'
import * as botpress from '.botpress'

const teams = new botpress.teams.Teams()
const zendesk = new botpress.zendesk.Zendesk()

export const bot = new botpress.Bot({
  integrations: {
    teams,
    zendesk,
  },
  configuration: {
    schema: z.object({}),
  },
  states: {
    flow: {
      type: 'conversation',
      schema: z.object({
        hitlEnabled: z.boolean(),
      }),
      ui: {
        hitlEnabled: {
          title: 'HITL Enabled',
          examples: [true, false],
        },
      },
    },
  },
  events: {},
  recurringEvents: {},
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
    },
  },
})
