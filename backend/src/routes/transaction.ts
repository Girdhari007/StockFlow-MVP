import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get Transactions
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      include: { stock: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Buy Stock
router.post("/buy", async (req: AuthRequest, res: Response) => {
  try {
    const { stockId, quantity, price } = req.body;

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user.userId },
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        stockId,
        quantity,
        price,
        total: quantity * price,
        type: "BUY",
      },
    });

    // Update or create holding
    const existing = await prisma.holding.findUnique({
      where: { portfolioId_stockId: { portfolioId: portfolio.id, stockId } },
    });

    if (existing) {
      await prisma.holding.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          avgCost:
            (existing.avgCost * existing.quantity + price * quantity) /
            (existing.quantity + quantity),
        },
      });
    } else {
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          stockId,
          quantity,
          avgCost: price,
        },
      });
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Transaction failed" });
  }
});

// Sell Stock
router.post("/sell", async (req: AuthRequest, res: Response) => {
  try {
    const { stockId, quantity, price } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        stockId,
        quantity,
        price,
        total: quantity * price,
        type: "SELL",
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Transaction failed" });
  }
});

export default router;
