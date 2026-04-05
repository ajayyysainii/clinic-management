import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.DB_URI as string)
    console.log('Database connected')
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

export default connectDB
