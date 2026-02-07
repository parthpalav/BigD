import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed", (error as Error).message);
    console.log("⚠️  Server will continue without database connection");
    throw error; // Throw to let caller handle
  }
};

export default connectDB;
