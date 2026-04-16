const db = require("../../config/db");
const { uid, paginate, paginationMeta } = require("../../utils");

const PLAN_PRICES = { basic: 4.99, premium: 9.99, vip: 19.99 };

// GET /api/subscriptions  (fan: see who I subscribe to)
exports.mySubscriptions = (req, res, next) => {
  try {
    const subs = db.prepare(
      `SELECT s.*, u.name, u.username, u.avatar_url, u.verified
       FROM subscriptions s JOIN users u ON u.id=s.creator_id
       WHERE s.fan_id=? ORDER BY s.started_at DESC`
    ).all(req.userId);
    res.json({ data: subs });
  } catch (err) { next(err); }
};

// GET /api/subscriptions/subscribers  (creator: see my subscribers)
exports.mySubscribers = (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM subscriptions WHERE creator_id=? AND status='active'").get(req.userId).n;
    const subs  = db.prepare(
      `SELECT s.*, u.name, u.username, u.avatar_url FROM subscriptions s
       JOIN users u ON u.id=s.fan_id
       WHERE s.creator_id=? AND s.status='active'
       ORDER BY s.started_at DESC LIMIT ? OFFSET ?`
    ).all(req.userId, limit, offset);
    res.json({ data: subs, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// GET /api/subscriptions/plans/:creatorId
exports.getPlans = (req, res, next) => {
  try {
    const plans = db.prepare("SELECT * FROM subscription_plans WHERE creator_id=?").get(req.params.creatorId);
    if (!plans) {
      return res.json({ data: { creator_id: req.params.creatorId, ...PLAN_PRICES, currency: "USD" } });
    }
    res.json({ data: plans });
  } catch (err) { next(err); }
};

// POST /api/subscriptions/plans
exports.setPlans = (req, res, next) => {
  try {
    const basic_price   = parseFloat(req.body.basic_price)   || PLAN_PRICES.basic;
    const premium_price = parseFloat(req.body.premium_price) || PLAN_PRICES.premium;
    const vip_price     = parseFloat(req.body.vip_price)     || PLAN_PRICES.vip;
    const currency      = req.body.currency || "USD";
    const now           = Date.now();

    const existing = db.prepare("SELECT id FROM subscription_plans WHERE creator_id=?").get(req.userId);
    if (existing) {
      db.prepare(
        "UPDATE subscription_plans SET basic_price=?,premium_price=?,vip_price=?,currency=?,updated_at=? WHERE creator_id=?"
      ).run(basic_price, premium_price, vip_price, currency, now, req.userId);
    } else {
      db.prepare(
        "INSERT INTO subscription_plans (id,creator_id,basic_price,premium_price,vip_price,currency,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)"
      ).run(uid(), req.userId, basic_price, premium_price, vip_price, currency, now, now);
    }

    res.json({ data: db.prepare("SELECT * FROM subscription_plans WHERE creator_id=?").get(req.userId) });
  } catch (err) { next(err); }
};

// POST /api/subscriptions/:creatorId
exports.subscribe = (req, res, next) => {
  try {
    const creatorId = req.params.creatorId;
    const plan      = ["basic", "premium", "vip"].includes(req.body.plan) ? req.body.plan : "basic";

    if (creatorId === req.userId) return res.status(400).json({ error: "Cannot subscribe to yourself." });

    const creator = db.prepare("SELECT id, role FROM users WHERE id=?").get(creatorId);
    if (!creator || creator.role !== "creator")
      return res.status(404).json({ error: "Creator not found." });

    // Get price
    const plans = db.prepare("SELECT * FROM subscription_plans WHERE creator_id=?").get(creatorId);
    const price = plans ? plans[`${plan}_price`] : PLAN_PRICES[plan];

    // Check wallet balance
    const wallet = db.prepare("SELECT available FROM wallets WHERE user_id=?").get(req.userId);
    if (!wallet || wallet.available < price)
      return res.status(400).json({ error: "Insufficient balance. Please add funds." });

    const now      = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    const creatorCut = +(price * 0.8).toFixed(2);

    const existing = db.prepare("SELECT * FROM subscriptions WHERE creator_id=? AND fan_id=?").get(creatorId, req.userId);

    db.transaction(() => {
      if (existing) {
        db.prepare("UPDATE subscriptions SET plan=?,status='active',expires_at=?,started_at=? WHERE creator_id=? AND fan_id=?")
          .run(plan, expiresAt, now, creatorId, req.userId);
      } else {
        db.prepare(
          "INSERT INTO subscriptions (id,creator_id,fan_id,plan,status,started_at,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)"
        ).run(uid(), creatorId, req.userId, plan, "active", now, expiresAt, now);
      }

      db.prepare("UPDATE wallets SET available=available-?,updated_at=? WHERE user_id=?").run(price, now, req.userId);
      db.prepare("UPDATE wallets SET pending=pending+?,updated_at=? WHERE user_id=?").run(creatorCut, now, creatorId);

      db.prepare("INSERT INTO transactions (id,user_id,type,amount,status,source,created_at) VALUES (?,?,?,?,?,?,?)")
        .run(uid(), req.userId, "subscription", -price, "completed", creatorId, now);
      db.prepare("INSERT INTO transactions (id,user_id,type,amount,status,source,created_at) VALUES (?,?,?,?,?,?,?)")
        .run(uid(), creatorId, "subscription", creatorCut, "completed", req.userId, now);

      // Boost recommendation score for creator
      db.prepare("UPDATE profiles SET recommendation_score=recommendation_score+5,updated_at=? WHERE user_id=?").run(now, creatorId);
    })();

    const sub = db.prepare("SELECT * FROM subscriptions WHERE creator_id=? AND fan_id=?").get(creatorId, req.userId);
    res.status(201).json({ data: sub });
  } catch (err) { next(err); }
};

// DELETE /api/subscriptions/:creatorId
exports.cancel = (req, res, next) => {
  try {
    const result = db.prepare(
      "UPDATE subscriptions SET status='cancelled' WHERE creator_id=? AND fan_id=? AND status='active'"
    ).run(req.params.creatorId, req.userId);

    if (!result.changes) return res.status(404).json({ error: "Active subscription not found." });
    res.json({ data: { cancelled: true, message: "Subscription cancelled. Access continues until expiry date." } });
  } catch (err) { next(err); }
};
