import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import { Card, Carousel, Choice, Dropdown, Location, MessengerAttachment } from './types'
import * as bp from '.botpress'

export function getMessengerClient(ctx: bp.configuration.Configuration) {
  return new MessengerClient({
    accessToken: ctx.accessToken,
    appSecret: ctx.appSecret,
    appId: ctx.appId,
  })
}

export function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

export function formatCardElement(payload: Card) {
  const buttons: MessengerAttachment[] = []

  payload.actions.forEach((action) => {
    switch (action.action) {
      case 'postback':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `postback:${action.value}`,
        })
        break
      case 'say':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `say:${action.value}`,
        })
        break
      case 'url':
        buttons.push({
          type: 'web_url',
          title: action.label,
          url: action.value,
        })
        break
      default:
        break
    }
  })
  return {
    title: payload.title,
    image_url: payload.imageUrl,
    subtitle: payload.subtitle,
    buttons,
  }
}

export function getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        templateType: 'generic',
        elements: payload.items.map(formatCardElement),
      },
    },
  }
}

export function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.TextMessage {
  if (!payload.options.length) {
    return { text: payload.text }
  }

  // If there are more than 13 options, we can't use quick replies as per Messenger's limitations
  // We'll just send a text message with the options
  if (payload.options.length > 13) {
    const lines = payload.options.map((o, idx) => `${idx + 1}. ${o.label}`).join('\n')
    return {
      text: `${payload.text}\n\n${lines}`.trim(),
    }
  }

  return {
    text: payload.text?.trim().length ? payload.text : undefined,
    quickReplies: payload.options.map((option) => ({
      contentType: 'text',
      title: option.label,
      payload: option.value,
    })),
  }
}
