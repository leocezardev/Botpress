import * as botpress from '.botpress'
import axios from 'axios'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export default new botpress.Integration({
  register: async () => {}, 
  unregister: async () => {},
  actions: {
    sendData: async function ({ ctx, input, logger }): Promise<botpress.actions.sendData.output.Output> {
      logger.forBot().info('Sending data to Make.com');
  
      const webhookURL = ctx.configuration.webhookUrl;
      let dataToSend;
      try {
        dataToSend = JSON.parse(input.data);
      } catch (error) {
        if (error instanceof Error) {
          logger.forBot().error(`Invalid JSON format: ${error.message}`);
        } else {
          logger.forBot().error(`Invalid JSON format and the error could not be identified`);
        }
        return { response: [{ response: 'Invalid data format' }] };
      }
      
  
      const nestedData = { data: dataToSend };
      const start = Date.now();
      try {
        const response = await axios.post(webhookURL, nestedData);
        const duration = Date.now() - start;
        logger.forBot().info(`Status code: ${response.status}`);
        logger.forBot().info(`Successfully sent data to Make.com, duration: ${duration}ms`);
        return { response: [{ response: response.data }] };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response ? error.response.status : 'Network Error';
          logger.forBot().error(`Error sending data to Make.com: ${status}`);
          const duration = Date.now() - start;
          logger.forBot().error(`Failed to send data to Make.com, duration: ${duration}ms, error: ${error}`);
          return { response: [{ response: `Error: ${status}` }] };
        } else {
          logger.forBot().error(`An unknown error occurred while sending data to Make.com`);
          return { response: [{ response: 'An unknown error occurred' }] };
        }
      }
    }    
  },
  channels: {
    channel: {
      messages: {
        text: async () => {
          throw new NotImplementedError()
        },
        image: async () => {
          throw new NotImplementedError()
        },
        markdown: async () => {
          throw new NotImplementedError()
        },
        audio: async () => {
          throw new NotImplementedError()
        },
        video: async () => {
          throw new NotImplementedError()
        },
        file: async () => {
          throw new NotImplementedError()
        },
        location: async () => {
          throw new NotImplementedError()
        },
        carousel: async () => {
          throw new NotImplementedError()
        },
        card: async () => {
          throw new NotImplementedError()
        },
        choice: async () => {
          throw new NotImplementedError()
        },
        dropdown: async () => {
          throw new NotImplementedError()
        },
      },
    },
  },
  handler: async () => {},
})