import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { SlackContext } from '../backend/typings'

export class SlackImageRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SlackImageRenderer.name
  }

  handles(context: SlackContext): boolean {
    return context.payload.image
  }

  render(context: SlackContext) {
    const payload = context.payload as sdk.ImageContent

    context.message.blocks.push({
      type: 'image',
      title: payload.title && {
        type: 'plain_text',
        text: payload.title as string
      },
      image_url: payload.image,
      alt_text: 'image'
    })
  }
}
