import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { dialogConditions } from './conditions'
import { getIntents, updateIntent } from './intents/intent-service'
import { getOnBotMount } from './module-lifecycle/on-bot-mount'
import { getOnBotUnmount } from './module-lifecycle/on-bot-unmount'
import { getOnServerReady } from './module-lifecycle/on-server-ready'
import { getOnSeverStarted } from './module-lifecycle/on-server-started'
import { NLUState } from './typings'

const state: NLUState = { nluByBot: {} }

const onServerStarted = getOnSeverStarted(state)
const onServerReady = getOnServerReady(state)
const onBotMount = getOnBotMount(state)
const onBotUnmount = getOnBotUnmount(state)
const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('nlu.incoming')
  bp.http.deleteRouterForBot('nlu')
  // if module gets deactivated but server keeps running, we want to destroy bot state
  Object.keys(state.nluByBot).forEach(botID => () => onBotUnmount(bp, botID))
}

const onTopicRenamed = async (bp: typeof sdk, botId: string, oldName: string, newName: string) => {
  const ghost = bp.ghost.forBot(botId)
  const intentDefs = await getIntents(ghost)

  for (const intentDef of intentDefs) {
    const ctxIdx = intentDef.contexts.indexOf(oldName)
    if (ctxIdx !== -1) {
      intentDef.contexts.splice(ctxIdx, 1)
      await updateIntent(ghost, intentDef.name, intentDef)
    }
  }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  onTopicRenamed,
  dialogConditions,
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'translate',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
