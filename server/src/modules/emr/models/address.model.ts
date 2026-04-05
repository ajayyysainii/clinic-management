import { Schema, model, Document, Types } from 'mongoose'

interface Address {
  name: string
  street: string
  city: string
  state: string
  zipCode: string
}

const AddressSchema = new Schema<Address>({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
})
