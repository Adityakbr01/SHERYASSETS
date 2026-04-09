import mongoose, { Schema } from 'mongoose'
import { ASSET_STATUSES, type IAsset } from './assets.type'

const assetSchema: Schema<IAsset> = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    imageId: {
      type: String,
      required: true,
      trim: true,
    },
    // this is a folder like structure to organize assets, it can be 'untitled' if not provided in feuture move to a separate collection if needed
    path: {
      type: String,
      default: 'untitled',
      trim: true,
    },
    originalKey: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    format: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mimeType: {
      type: String,
      trim: true,
      lowercase: true,
    },
    width: {
      type: Number,
      min: 1,
    },
    height: {
      type: Number,
      min: 1,
    },
    status: {
      type: String,
      enum: ASSET_STATUSES,
      default: 'processing',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

assetSchema.index({ tenantId: 1, createdAt: -1 })
assetSchema.index({ tenantId: 1, status: 1 })
assetSchema.index({ tenantId: 1, imageId: 1 }, { unique: true })

export const Asset = mongoose.model<IAsset>('Asset', assetSchema)
