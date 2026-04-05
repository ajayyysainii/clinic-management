import { sendServerLog } from '../utils/helpers'

export function handleError() {
  // Uncaught exceptions
  process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err)

    const message = `App Crash Alert: ${JSON.stringify(err)}`
    await sendServerLog(message)

    process.exit(1)
  })

  // Unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'Reason:', reason)

    const message = `App Crash Alert: ${JSON.stringify(reason)}`
    await sendServerLog(message)

    process.exit(1)
  })
}
