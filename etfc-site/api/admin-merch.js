const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

async function listProducts(req, res) {
  try {
    const snap = await db.collection("merchProducts").orderBy("createdAt", "desc").get();
    const products = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        images: d.images || [],
        basePrice: d.basePrice,
        offerPrice: d.offerPrice,
        offerEndsAt: d.offerEndsAt ? d.offerEndsAt.toMillis() : null,
        colors: d.colors || [],
        sizes: d.sizes || [],
        category: d.category,
        stock: d.stock,
        active: d.active,
        createdAt: d.createdAt ? d.createdAt.toMillis() : null,
      };
    });
    return res.status(200).json({ products });
  } catch (err) {
    console.error("admin-merch GET failed:", err);
    return res.status(500).json({ error: "Could not load products." });
  }
}

async function createProduct(req, res) {
  const { name, slug, description, images, basePrice, offerPrice, offerEndsAt, colors, sizes, category, stock, active } = req.body || {};
  if (!name || !slug || !basePrice) {
    return res.status(400).json({ error: "Name, slug, and base price are required." });
  }

  const existing = await db.collection("merchProducts").where("slug", "==", slug).limit(1).get();
  if (!existing.empty) {
    return res.status(409).json({ error: "Slug already exists." });
  }

  try {
    const ref = await db.collection("merchProducts").add({
      name,
      slug,
      description: description || "",
      images: images || [],
      basePrice: Number(basePrice),
      offerPrice: offerPrice ? Number(offerPrice) : null,
      offerEndsAt: offerEndsAt ? admin.firestore.Timestamp.fromMillis(offerEndsAt) : null,
      colors: colors || [],
      sizes: sizes || [],
      category: category || "General",
      stock: Number(stock) || 0,
      active: active !== false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ ok: true, id: ref.id });
  } catch (err) {
    console.error("create product failed:", err);
    return res.status(500).json({ error: "Could not create product." });
  }
}

async function updateProduct(req, res) {
  const { id, ...data } = req.body || {};
  if (!id) return res.status(400).json({ error: "Product ID required." });

  const ref = db.collection("merchProducts").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Product not found." });

  const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (updateData.offerEndsAt) updateData.offerEndsAt = admin.firestore.Timestamp.fromMillis(updateData.offerEndsAt);
  if (updateData.basePrice) updateData.basePrice = Number(updateData.basePrice);
  if (updateData.offerPrice) updateData.offerPrice = Number(updateData.offerPrice);
  if (updateData.stock) updateData.stock = Number(updateData.stock);

  try {
    await ref.update(updateData);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("update product failed:", err);
    return res.status(500).json({ error: "Could not update product." });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "Product ID required." });

  try {
    await db.collection("merchProducts").doc(id).delete();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("delete product failed:", err);
    return res.status(500).json({ error: "Could not delete product." });
  }
}

async function listOrders(req, res) {
  const status = req.query.status || "pending";
  try {
    let query = db.collection("merchOrders");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }
    const snap = await query.orderBy("createdAt", "desc").get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        productId: d.productId,
        productName: d.productName,
        productSlug: d.productSlug,
        quantity: d.quantity,
        color: d.color,
        size: d.size,
        buyerName: d.buyerName,
        phone: d.phone,
        email: d.email,
        userId: d.userId,
        unitPrice: d.unitPrice,
        totalAmount: d.totalAmount,
        refCode: d.refCode,
        screenshotUrl: d.screenshotUrl,
        status: d.status,
        createdAt: d.createdAt ? d.createdAt.toMillis() : null,
      };
    });
    return res.status(200).json({ orders });
  } catch (err) {
    console.error("admin-merch-orders GET failed:", err);
    return res.status(500).json({ error: "Could not load orders." });
  }
}

async function reviewOrder(req, res) {
  const { orderId, action } = req.body || {};
  if (!orderId || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "orderId and valid action required." });
  }

  const orderRef = db.collection("merchOrders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return res.status(404).json({ error: "Order not found." });
  const order = orderSnap.data();
  if (order.status !== "pending") return res.status(409).json({ error: `Order is already ${order.status}.` });

  try {
    if (action === "approve") {
      await orderRef.update({
        status: "confirmed",
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ ok: true, status: "confirmed" });
    } else {
      const productRef = db.collection("merchProducts").doc(order.productId);
      await db.runTransaction(async (tx) => {
        tx.update(orderRef, {
          status: "rejected",
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (typeof order.quantity === "number") {
          tx.update(productRef, {
            stock: admin.firestore.FieldValue.increment(order.quantity),
          });
        }
      });
      return res.status(200).json({ ok: true, status: "rejected" });
    }
  } catch (err) {
    console.error("review merch order failed:", err);
    return res.status(500).json({ error: "Could not update order." });
  }
}

module.exports = async (req, res) => {
  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  if (req.method === "GET") {
    if (req.query.type === "orders") return listOrders(req, res);
    return listProducts(req, res);
  }
  if (req.method === "POST") {
    if (req.query.action === "review") return reviewOrder(req, res);
    if (req.body.id) return updateProduct(req, res);
    return createProduct(req, res);
  }
  if (req.method === "DELETE") {
    return deleteProduct(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
};