import { IO } from 'botpress/sdk'
import { Collapsible } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

import style from '../../style.scss'

// To support complex content types, export message from webchat in ui-shared lite and show it here
export const Message: FC<IO.StoredEvent> = props => {
  const { preview, payload } = props.event
  return (
    <div className={cx(style.messageContainer, props.direction === 'incoming' ? style.user : style.bot)}>
      <div className={cx(style.message)}>
        {preview && <span>{preview}</span>}
        {!preview && (
          <Collapsible name={`type: ${payload.type}`}>
            <div>{JSON.stringify(payload, null, 2)}</div>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
