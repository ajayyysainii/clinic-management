import mongoose, { Schema, Document } from "mongoose";


interface IDietaryHabit {
  regularMeals: boolean;
  frequentSnacks: boolean;
  processedFoods: boolean;
  sodaJuices: boolean;
  restaurantFood: boolean;
}


interface ILiverRiskCalculator extends Document {
  user: mongoose.Types.ObjectId;
  age?: string;
  gender?: string;
  riskReasons?: string[];
  diabetes?: string;
  highBloodPressure?: string;
  exercise?: string;
  alcohol?: string;
  dietaryHabits?: IDietaryHabit;
  riskScore: number;
  riskLevel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DietaryHabitSchema = new Schema<IDietaryHabit>({
  regularMeals: {
    type: Boolean,
    default: false,
  },
  frequentSnacks: {
    type: Boolean,
    default: false,
  },
  processedFoods: {
    type: Boolean,
    default: false,
  },
  sodaJuices: {
    type: Boolean,
    default: false,
  },
  restaurantFood: {
    type: Boolean,
    default: false,
  },
});

const LiverRiskCalculatorSchema = new Schema<ILiverRiskCalculator>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    age: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    riskReasons: {
      type: [String],
    },
    diabetes: {
      type: String,
      trim: true,
    },
    highBloodPressure: {
      type: String,
      trim: true,
    },
    exercise: {
      type: String,
      trim: true,
    },
    alcohol: {
      type: String,
      trim: true,
    },
    dietaryHabits: DietaryHabitSchema,
    riskScore: {
      type: Number,
      required: [true, "risk score is required !"],
    },
    riskLevel: {
      type: String,
      required: [true, "risk level is required !"],
    },
  },
  { timestamps: true }
);


export { ILiverRiskCalculator, IDietaryHabit };
export default mongoose.model<ILiverRiskCalculator>(
  "LiverRiskCalculator",
  LiverRiskCalculatorSchema
);
