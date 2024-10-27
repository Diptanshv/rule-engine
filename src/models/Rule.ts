// models/Rule.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Node, NodeType, Operator, ComparisonOperator } from '../ruleEngine.js';

// Interface for Rule document
export interface RuleDocument extends Document {
  name: string;
  description?: string;
  ast: Node;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Schema for Node structure
const NodeSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(NodeType),
    required: true
  },
  operator: {
    type: String,
    enum: [...Object.values(Operator), ...Object.values(ComparisonOperator)]
  },
  left: { type: Schema.Types.Mixed },
  right: { type: Schema.Types.Mixed },
  value: { type: Schema.Types.Mixed },
  attribute: { type: String },
  isOptional: { type: Boolean, default: false }
}, { _id: false });

// Main Rule Schema
const RuleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ast: {
    type: NodeSchema,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
RuleSchema.index({ name: 1 }, { unique: true });
RuleSchema.index({ isActive: 1 });

export const Rule = mongoose.model<RuleDocument>('Rule', RuleSchema);