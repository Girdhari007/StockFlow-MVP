import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get Portfolio
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user.userId },
      include: {
        holdings: {
          include: { stock: true },
        },
      },
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// Get Holdings
router.get("/holdings", async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user.userId },
      include: {
        holdings: {
          include: { stock: true },
        },
      },
    });

    res.json(portfolio?.holdings || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch holdings" });
  }
});

export default router;
