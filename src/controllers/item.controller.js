import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Item from "../models/item.model.js";
import User from "../models/user.model.js";

// Create a new item
const createItem = asyncHandler(async (req, res) => {
  const { name, description, price, image, type, amount, attribute_name, userId } = req.body;

  if (!name || !description || price === undefined || !type || amount === undefined) {
    throw new ApiError(400, "Name, description, price, type, and amount are required");
  }

  const item = await Item.create({
    name,
    description,
    price,
    image: image || "",
    type: type.toUpperCase(),
    amount,
    attribute_name: attribute_name || null,
    userId: userId || null,
  });

  let populatedItem = item;
  if (userId) {
    populatedItem = await Item.findById(item._id).populate({
      path: "userId",
      select: "_id name email",
    });
  }

  return res.status(201).json(
    new ApiResponse(201, populatedItem, "Item created successfully")
  );
});

// Get all items for a user (inventory)
const getUserItems = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const items = await Item.find({ userId })
    .populate({ path: "userId", select: "_id name email" })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, items, "User items retrieved successfully")
  );
});

// Get all store items (items without userId)
const getStoreItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ userId: null }).sort({ price: 1 });

  return res.status(200).json(
    new ApiResponse(200, items, "Store items retrieved successfully")
  );
});

// Get item by ID
const getItemById = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApiError(400, "Item ID is required");
  }

  const item = await Item.findById(itemId).populate({
    path: "userId",
    select: "_id name email",
  });

  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  return res.status(200).json(
    new ApiResponse(200, item, "Item retrieved successfully")
  );
});

// Update item
const updateItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { name, description, price, image, type, amount, claimed, attribute_name } = req.body;

  if (!itemId) {
    throw new ApiError(400, "Item ID is required");
  }

  const update = {};
  if (name) update.name = name;
  if (description) update.description = description;
  if (price !== undefined) update.price = price;
  if (image !== undefined) update.image = image;
  if (type) update.type = type.toUpperCase();
  if (amount !== undefined) update.amount = amount;
  if (claimed !== undefined) update.claimed = claimed;
  if (attribute_name !== undefined) update.attribute_name = attribute_name;

  const item = await Item.findByIdAndUpdate(itemId, update, { new: true }).populate({
    path: "userId",
    select: "_id name email",
  });

  return res.status(200).json(
    new ApiResponse(200, item, "Item updated successfully")
  );
});

// Delete item
const deleteItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApiError(400, "Item ID is required");
  }

  await Item.findByIdAndDelete(itemId);

  return res.status(200).json(
    new ApiResponse(200, null, "Item deleted successfully")
  );
});

// Purchase item from store
const purchaseItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { userId } = req.body;

  if (!itemId || !userId) {
    throw new ApiError(400, "Item ID and user ID are required");
  }

  const storeItem = await Item.findById(itemId);

  if (!storeItem) {
    throw new ApiError(404, "Item not found");
  }

  if (storeItem.userId !== null) {
    throw new ApiError(400, "Item is not available for purchase");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.coins < storeItem.price) {
    throw new ApiError(400, "Insufficient coins");
  }

  // Create a new item for the user's inventory
  const purchasedItem = await Item.create({
    name: storeItem.name,
    description: storeItem.description,
    price: storeItem.price,
    image: storeItem.image,
    type: storeItem.type,
    amount: storeItem.amount,
    attribute_name: storeItem.attribute_name,
    userId: userId,
    claimed: false,
  });

  // Deduct coins from user
  await User.findByIdAndUpdate(userId, { $inc: { coins: -storeItem.price } });

  return res.status(201).json(
    new ApiResponse(201, purchasedItem, "Item purchased successfully")
  );
});

// Use/Claim item
const useItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApiError(400, "Item ID is required");
  }

  const item = await Item.findById(itemId).populate("userId");

  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  if (item.claimed) {
    throw new ApiError(400, "Item already used");
  }

  // Apply item effects based on type and attribute
  let updatedUser = null;
  if (item.type === "MAGICAL ITEM" && item.attribute_name) {
    const attribute = item.attribute_name.toLowerCase();
    if (attribute === "health") {
      updatedUser = await User.findByIdAndUpdate(item.userId, { $inc: { health: item.amount } }, { new: true });
    } else if (attribute === "coins") {
      updatedUser = await User.findByIdAndUpdate(item.userId, { $inc: { coins: item.amount } }, { new: true });
    } else if (attribute === "experience") {
      updatedUser = await User.findByIdAndUpdate(item.userId, { $inc: { exp: item.amount } }, { new: true });
    }
  }

  // Mark item as claimed
  const updatedItem = await Item.findByIdAndUpdate(itemId, { claimed: true }, { new: true }).populate({
    path: "userId",
    select: "_id name email",
  });

  return res.status(200).json(
    new ApiResponse(200, { item: updatedItem, user: updatedUser }, "Item used successfully")
  );
});

export {
  createItem,
  getUserItems,
  getStoreItems,
  getItemById,
  updateItem,
  deleteItem,
  purchaseItem,
  useItem,
};
