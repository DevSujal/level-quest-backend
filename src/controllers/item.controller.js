import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new item
const createItem = asyncHandler(async (req, res) => {
  const { name, description, price, image, type, amount, attribute_name, userId } = req.body;

  if (!name || !description || price === undefined || !type || amount === undefined) {
    throw new ApiError(400, "Name, description, price, type, and amount are required");
  }

  const item = await prisma.item.create({
    data: {
      name,
      description,
      price,
      image: image || "",
      type: type.toUpperCase(),
      amount,
      attribute_name: attribute_name || null,
      userId: userId || null
    },
    include: userId ? {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    } : false
  });

  return res.status(201).json(
    new ApiResponse(201, item, "Item created successfully")
  );
});

// Get all items for a user (inventory)
const getUserItems = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const items = await prisma.item.findMany({
    where: { userId: parseInt(userId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(200).json(
    new ApiResponse(200, items, "User items retrieved successfully")
  );
});

// Get all store items (items without userId)
const getStoreItems = asyncHandler(async (req, res) => {
  const items = await prisma.item.findMany({
    where: { userId: null },
    orderBy: {
      price: 'asc'
    }
  });

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

  const item = await prisma.item.findUnique({
    where: { id: parseInt(itemId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
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

  const item = await prisma.item.update({
    where: { id: parseInt(itemId) },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price }),
      ...(image !== undefined && { image }),
      ...(type && { type: type.toUpperCase() }),
      ...(amount !== undefined && { amount }),
      ...(claimed !== undefined && { claimed }),
      ...(attribute_name !== undefined && { attribute_name })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
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

  await prisma.item.delete({
    where: { id: parseInt(itemId) }
  });

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

  const storeItem = await prisma.item.findUnique({
    where: { id: parseInt(itemId) }
  });

  if (!storeItem) {
    throw new ApiError(404, "Item not found");
  }

  if (storeItem.userId !== null) {
    throw new ApiError(400, "Item is not available for purchase");
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.coins < storeItem.price) {
    throw new ApiError(400, "Insufficient coins");
  }

  // Create a new item for the user's inventory
  const purchasedItem = await prisma.item.create({
    data: {
      name: storeItem.name,
      description: storeItem.description,
      price: storeItem.price,
      image: storeItem.image,
      type: storeItem.type,
      amount: storeItem.amount,
      attribute_name: storeItem.attribute_name,
      userId: parseInt(userId),
      claimed: false
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Deduct coins from user
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { coins: { decrement: storeItem.price } }
  });

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

  const item = await prisma.item.findUnique({
    where: { id: parseInt(itemId) },
    include: { user: true }
  });

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
      updatedUser = await prisma.user.update({
        where: { id: item.userId },
        data: { health: { increment: item.amount } }
      });
    } else if (attribute === "coins") {
      updatedUser = await prisma.user.update({
        where: { id: item.userId },
        data: { coins: { increment: item.amount } }
      });
    } else if (attribute === "experience") {
      updatedUser = await prisma.user.update({
        where: { id: item.userId },
        data: { exp: { increment: item.amount } }
      });
    }
  }

  // Mark item as claimed
  const updatedItem = await prisma.item.update({
    where: { id: parseInt(itemId) },
    data: { claimed: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
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
  useItem
};
