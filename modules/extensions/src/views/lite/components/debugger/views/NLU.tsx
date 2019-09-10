import { Colors, H4, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import { Intents } from '../components/Intents'
import style from '../style.scss'

import { Entities } from './Entities'
import { Language } from './Language'
import { Slots } from './Slots'

const NLU: SFC<{ nluData: sdk.IO.EventUnderstanding; session: any }> = ({ nluData, session }) => {
  return (
    <div className={style.block}>
      <div className={style.title}>
        <H4>Language Understanding</H4>
        {nluData.ambiguous && (
          <Tooltip
            position={Position.TOP}
            content={
              <span>
                Predicted intents are very close. You can account for it checking the{' '}
                <strong>event.nlu.ambiguous</strong> variable.
              </span>
            }
          >
            <span style={{ color: Colors.GRAY1 }}>
              <Icon icon="warning-sign" color={Colors.GRAY1} />
              &nbsp;Ambiguous
            </span>
          </Tooltip>
        )}
      </div>
      <Language detectedLanguage={nluData.detectedLanguage} usedLanguage={nluData.language} />
      <Intents intents={nluData.intents} intent={nluData.intent} />
      {nluData.entities.length > 0 && <Entities entities={nluData.entities} />}
      <Slots sessionSlots={session.slots} slots={nluData.slots} />
    </div>
  )
}

export default NLU
