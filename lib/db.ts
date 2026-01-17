import mongoose from "mongoose";

declare global {
  var mongooseConnection: typeof mongoose | undefined;
}

let mongooseConnection = global.mongooseConnection;

export async function connectDB() {
  if (mongooseConnection) {
    return mongooseConnection;
  }

  try {
    const MONGO_URL = process.env.MONGO_URL;
    
    if (!MONGO_URL) {
      throw new Error("MONGO_URL environment variable is not defined");
    }

    const connection = await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });

    mongooseConnection = connection;
    
    if (process.env.NODE_ENV !== "production") {
      global.mongooseConnection = connection;
    }

    console.log("MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default mongooseConnection;