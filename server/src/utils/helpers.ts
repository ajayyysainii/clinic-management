import CONSTANTS from './constants'
import axios from 'axios'

export const sendServerLog = async (message: any) => {
  try {
    const data = {
      text: `${message}`,
    }

    await axios.post(CONSTANTS.GOOGLE_CHAT_WEBHOOK_URL, data)
    console.log('Server log sent to Google Chat successfully')
  } catch (error) {
    console.error('Error sending server log to Google Chat', error)
  }
}
