import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import _ from 'lodash'
import { Markup, Telegraf, Telegram } from 'telegraf'
import type { User, CommonMessageBundle } from 'telegraf/typings/core/types/typegram'
import { chatIdTag, idTag, fromUserIdTag, fromUserNameTag, INTEGRATION_NAME } from './const'

import { getUserPictureDataUri, getUserNameFromTelegramUser, getChat, sendCard, ackMessage } from './misc/utils'
import * as bp from '.botpress'

console.info(`starting integration ${INTEGRATION_NAME}`)

type MessageTypes = keyof typeof bp.channels.channel
type BotpressMessage<T extends MessageTypes = MessageTypes> = T extends MessageTypes
  ? {
      type: T
      payload: bp.channels.channel.Messages[T]
    }
  : never

const convertTelegramMessageToBotpressMessage = async (
  message: CommonMessageBundle,
  telegram: Telegram
): Promise<BotpressMessage> => {
  if ('text' in message) {
    return {
      type: 'text',
      payload: { text: message.text },
    }
  }

  if ('photo' in message) {
    const photo = _.maxBy(message.photo, (photo) => photo.height * photo.width)

    if (!photo) {
      throw new Error('No photo found in the message')
    }

    const link = await telegram.getFileLink(photo.file_id)

    return {
      type: 'image',
      payload: {
        imageUrl: link.toString(),
      },
    }
  }

  if ('audio' in message) {
    return {
      type: 'audio',
      payload: {
        audioUrl: message.audio.file_id,
      },
    }
  }

  if ('video' in message) {
    return {
      type: 'video',
      payload: {
        videoUrl: message.video.file_id,
      },
    }
  }

  if ('document' in message) {
    return {
      type: 'file',
      payload: {
        fileUrl: message.document.file_id,
      },
    }
  }

  throw new Error('Unsupported message type')
}

const integration = new bp.Integration({
  register: async ({ webhookUrl, ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.setWebhook(webhookUrl)
  },
  unregister: async ({ ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.deleteWebhook({ drop_pending_updates: true })
  },
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          const { text } = payload
          logger.forBot().debug(`Sending text message to Telegram chat ${chat}:`, text)
          const message = await client.telegram.sendMessage(chat, text)
          await ackMessage(message, ack)
        },
        image: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending image message to Telegram chat ${chat}`, payload.imageUrl)
          const message = await client.telegram.sendPhoto(chat, payload.imageUrl)
          await ackMessage(message, ack)
        },
        markdown: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending markdown message to Telegram chat ${chat}:`, payload.markdown)
          const message = await client.telegram.sendMessage(chat, payload.markdown, {
            parse_mode: 'MarkdownV2',
          })
          await ackMessage(message, ack)
        },
        audio: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending audio message to Telegram chat ${chat}:`, payload.audioUrl)
          const message = await client.telegram.sendAudio(chat, payload.audioUrl)
          await ackMessage(message, ack)
        },
        video: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending video message to Telegram chat ${chat}:`, payload.videoUrl)
          const message = await client.telegram.sendVideo(chat, payload.videoUrl)
          await ackMessage(message, ack)
        },
        file: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending file message to Telegram chat ${chat}:`, payload.fileUrl)
          const message = await client.telegram.sendDocument(chat, payload.fileUrl)
          await ackMessage(message, ack)
        },
        location: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending location message to Telegram chat ${chat}:`, {
            latitude: payload.latitude,
            longitude: payload.longitude,
          })
          const message = await client.telegram.sendLocation(chat, payload.latitude, payload.longitude)
          await ackMessage(message, ack)
        },
        card: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending card message to Telegram chat ${chat}:`, payload)
          await sendCard(payload, client, chat, ack)
        },
        carousel: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending carousel message to Telegram chat ${chat}:`, payload)
          payload.items.forEach(async (item) => {
            await sendCard(item, client, chat, ack)
          })
        },
        dropdown: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          logger.forBot().debug(`Sending dropdown message to Telegram chat ${chat}:`, payload)
          const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
          await ackMessage(message, ack)
        },
        choice: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending choice message to Telegram chat ${chat}:`, payload)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
          await ackMessage(message, ack)
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    logger.forBot().debug('Handler received request from Telegram with payload:', req.body)

    if (!req.body) {
      logger.forBot().warn('Handler received an empty body, so the message was ignored')
      return
    }

    const data = JSON.parse(req.body)

    if (data.my_chat_member) {
      logger.forBot().warn('Handler received a chat member update, so the message was ignored')
      return
    }

    if (data.channel_post) {
      logger.forBot().warn('Handler received a channel post, so the message was ignored')
      return
    }

    if (data.edited_channel_post) {
      logger.forBot().warn('Handler received an edited channel post, so the message was ignored')
      return
    }

    if (data.edited_message) {
      logger.forBot().warn('Handler received an edited message, so the message was ignored')
      return
    }

    if (!data.message) {
      logger.forBot().warn('Handler received a non-message update, so the event was ignored')
      return
    }

    const message = data.message as CommonMessageBundle

    if (message.from?.is_bot) {
      logger.forBot().warn('Handler received a message from a bot, so the message was ignored')
      return
    }

    if (message.chat?.type !== 'private' || message.sender_chat?.type !== 'private') {
      logger.forBot().warn('Handler received a message from a private chat, so the message was ignored')
      return
    }

    if (!('text' in message) && !('photo' in message)) {
      logger.forBot().warn('Request body does not contain a text message or photo, so the message was ignored')
      return
    }

    const conversationId = message.chat.id

    if (!conversationId) {
      throw new Error('Handler received message with empty "chat.id" value')
    }

    const userId = message.from?.id
    const chatId = message.chat?.id

    if (!userId) {
      throw new Error('Handler received message with empty "from.id" value')
    }

    const userName = getUserNameFromTelegramUser(message.from as User)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        [idTag]: conversationId.toString(),
        [fromUserIdTag]: userId.toString(),
        [fromUserNameTag]: userName,
        ...(chatId && { [chatIdTag]: chatId.toString() }),
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        [idTag]: userId.toString(),
      },
      ...(userName && { name: userName }),
    })

    const userFieldsToUpdate = {
      pictureUrl: !user.pictureUrl
        ? await getUserPictureDataUri({
            botToken: ctx.configuration.botToken,
            telegramUserId: userId,
            logger,
          })
        : undefined,
      name: user.name !== userName ? userName : undefined,
    }

    if (userFieldsToUpdate.pictureUrl || userFieldsToUpdate.name) {
      await client.updateUser({
        ...user,
        ...(userFieldsToUpdate.pictureUrl && { pictureUrl: userFieldsToUpdate.pictureUrl }),
        ...(userFieldsToUpdate.name && { name: userFieldsToUpdate.name }),
      })
    }

    const messageId = message.message_id

    if (!messageId) {
      throw new Error('Handler received an empty message id')
    }

    logger.forBot().debug(`Received message from user ${userId}: ${message.text}`)
    await client.createMessage({
      tags: {
        [idTag]: messageId.toString(),
        ...(chatId && { [chatIdTag]: chatId.toString() }),
      },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: message.text },
    })
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = Number(tags[idTag])

    if (isNaN(userId)) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const member = await telegraf.telegram.getChatMember(userId, userId)

    const { user } = await client.getOrCreateUser({ tags: { [idTag]: `${member.user.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const chatId = tags[idTag]

    if (!chatId) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const chat = await telegraf.telegram.getChat(chatId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { [idTag]: chat.id.toString() },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
