import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import portfolioRoutes from "./routes/portfolio";
import transactionRoutes from "./routes/transaction";
import { authenticateToken } from "./middleware/auth";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", authenticateToken, portfolioRoutes);
app.use("/api/transactions", authenticateToken, transactionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
