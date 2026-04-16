const db = require("../../config/db");
const { uid, paginate, paginationMeta } = require("../../utils");

const PLATFORM_FEE = 0.20; // 20% platform cut

// GET /api/wallet
exports.getWallet = (req, res, next) => {
  try {
    const wallet = db.prepare("SELECT * FROM wallets WHERE user_id=?").get(req.userId);
    if (!wallet) return res.status(404).json({ error: "Wallet not found." });
    res.json({ data: wallet });
  } catch (err) { next(err); }
};

// GET /api/wallet/transactions
exports.getTransactions = (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM transactions WHERE user_id=?").get(req.userId).n;
    const txns  = db.prepare(
      "SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).all(req.userId, limit, offset);
    res.json({ data: txns, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// GET /api/wallet/earnings  (creator only)
exports.getEarnings = (req, res, next) => {
  try {
    const wallet = db.prepare("SELECT * FROM wallets WHERE user_id=?").get(req.userId);
    const subscriptions = db.prepare(
      "SELECT COUNT(*) as n FROM subscriptions WHERE creator_id=? AND status='active'"
    ).get(req.userId).n;
    const monthly = db.prepare(
      "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type='tip_received' AND status='completed' AND created_at > ?"
    ).get(req.userId, Date.now() - 30 * 24 * 60 * 60 * 1000).total;

    res.json({
      data: {
        available:         wallet?.available   || 0,
        pending:           wallet?.pending     || 0,
        paid_out:          wallet?.paid_out    || 0,
        active_subscribers: subscriptions,
        earnings_30d:      monthly,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/wallet/tip/:creatorId
exports.tipCreator = (req, res, next) => {
  try {
    const creatorId = req.params.creatorId;
    const amount    = parseFloat(req.body.amount);

    if (!amount || amount <= 0) return res.status(400).json({ error: "Valid amount required." });
    if (creatorId === req.userId)  return res.status(400).json({ error: "Cannot tip yourself." });

    const fanWallet = db.prepare("SELECT available FROM wallets WHERE user_id=?").get(req.userId);
    if (!fanWallet || fanWallet.available < amount)
      return res.status(400).json({ error: "Insufficient balance." });

    const creatorAmount = +(amount * (1 - PLATFORM_FEE)).toFixed(2);
    const now = Date.now();

    db.transaction(() => {
      db.prepare("UPDATE wallets SET available=available-?,updated_at=? WHERE user_id=?").run(amount, now, req.userId);
      db.prepare("UPDATE wallets SET pending=pending+?,updated_at=? WHERE user_id=?").run(creatorAmount, now, creatorId);

      db.prepare(
        "INSERT INTO transactions (id,user_id,type,amount,status,source,created_at) VALUES (?,?,?,?,?,?,?)"
      ).run(uid(), req.userId, "tip", -amount, "completed", creatorId, now);

      db.prepare(
        "INSERT INTO transactions (id,user_id,type,amount,status,source,created_at) VALUES (?,?,?,?,?,?,?)"
      ).run(uid(), creatorId, "tip_received", creatorAmount, "completed", req.userId, now);
    })();

    res.json({ data: { sent: amount, creator_received: creatorAmount } });
  } catch (err) { next(err); }
};

// POST /api/wallet/withdraw
exports.requestWithdrawal = (req, res, next) => {
  try {
    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Valid amount required." });
    if (amount < 10) return res.status(400).json({ error: "Minimum withdrawal is $10." });

    const wallet = db.prepare("SELECT available FROM wallets WHERE user_id=?").get(req.userId);
    if (!wallet || wallet.available < amount)
      return res.status(400).json({ error: "Insufficient available balance." });

    const now = Date.now();
    db.transaction(() => {
      db.prepare("UPDATE wallets SET available=available-?,reserved=reserved+?,updated_at=? WHERE user_id=?").run(amount, amount, now, req.userId);
      db.prepare(
        "INSERT INTO transactions (id,user_id,type,amount,status,source,created_at) VALUES (?,?,?,?,?,?,?)"
      ).run(uid(), req.userId, "payout", amount, "pending", "withdrawal_request", now);
    })();

    // In production: trigger payout via Stripe/PayPal
    res.json({ data: { requested: amount, status: "pending", message: "Withdrawal request submitted. Processing in 1-3 business days." } });
  } catch (err) { next(err); }
};
