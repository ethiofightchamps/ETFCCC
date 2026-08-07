const admin = require("./_firebaseAdmin");

const db = admin.firestore();

function generateRefCode() {
  return "ETFC-MERCH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    productId,
    productName,
    productSlug,
    quantity,
    color,
    size,
    buyerName,
    phone,
    paymentMethod,
    email,
    userId,
    screenshotUrl,
    unitPrice,
    totalAmount,
  } = req.body || {};

  if (!productId || !productName || !quantity || !color || !size) {
    return res.status(400).json({ error: "Missing required product fields." });
  }
  if (!buyerName || !phone) {
    return res.status(400).json({ error: "Missing required buyer info." });
  }
  if (!screenshotUrl || typeof screenshotUrl !== "string") {
    return res.status(400).json({ error: "Payment screenshot is required." });
  }
  const allowedHosts = ["firebasestorage", "storage.googleapis.com", "cloudinary.com", "res.cloudinary.com"];
  if (!allowedHosts.some((h) => screenshotUrl.includes(h))) {
    return res.status(400).json({ error: "Invalid screenshot URL." });
  }

  try {
    const dupSnap = await db.collection("merchOrders")
      .where("screenshotUrl", "==", screenshotUrl)
      .limit(1)
      .get();
    if (!dupSnap.empty) {
      return res.status(400).json({ error: "This payment screenshot has already been used." });
    }

    const productRef = db.collection("merchProducts").doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return res.status(404).json({ error: "Product not found." });
    }
    const product = productSnap.data();
    if (!product.active) {
      return res.status(400).json({ error: "Product is not available." });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "Invalid quantity." });
    }

    const refCode = generateRefCode();
    const orderRef = db.collection("merchOrders").doc();

    await db.runTransaction(async (tx) => {
      tx.set(orderRef, {
        productId,
        productName,
        productSlug,
        quantity: qty,
        color,
        size,
        buyerName,
        phone,
        paymentMethod: paymentMethod || "mpesa",
        email: email || "",
        userId: userId || "",
        unitPrice: Number(unitPrice) || product.offerPrice || product.basePrice,
        totalAmount: Number(totalAmount) || (Number(unitPrice) || product.offerPrice || product.basePrice) * qty,
        screenshotUrl,
        refCode,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (typeof product.stock === "number" && product.stock >= qty) {
        tx.update(productRef, {
          stock: admin.firestore.FieldValue.increment(-qty),
        });
      }
    });

    return res.status(200).json({ ok: true, orderId: orderRef.id, refCode });
  } catch (err) {
    console.error("create-merch-order failed:", err);
    return res.status(500).json({ error: "Could not submit order. Try again." });
  }
};