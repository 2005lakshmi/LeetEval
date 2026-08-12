const Room = require('../models/Room');

/**
 * Sliding Window 15-Second In-Memory RAM Cache for Rooms & Exam Papers
 * Serves concurrent student joins 100% from RAM without hitting MongoDB.
 * Extends the 15-second TTL sliding window whenever any student accesses the room!
 */

const roomCacheMap = new Map(); // cleanRoomCode -> { room, expireAt }

async function getCachedRoom(roomCode) {
  if (!roomCode) return null;
  const cleanCode = roomCode.trim().toUpperCase();
  const now = Date.now();
  const TTL_MS = 15000; // 15 seconds sliding window

  let cachedEntry = roomCacheMap.get(cleanCode);

  if (cachedEntry && cachedEntry.expireAt > now) {
    // Sliding Window Refresh: extend 15 seconds from current access point!
    cachedEntry.expireAt = Date.now() + TTL_MS;
    return cachedEntry.room;
  }

  // Fetch fresh room details & populated question paper from MongoDB
  const room = await Room.findOne({ roomCode: cleanCode }).populate('paperId');

  if (room) {
    roomCacheMap.set(cleanCode, {
      room,
      expireAt: Date.now() + TTL_MS
    });
  }

  return room;
}

function invalidateRoomCache(roomCode = null) {
  if (roomCode) {
    const cleanCode = roomCode.trim().toUpperCase();
    roomCacheMap.delete(cleanCode);
  } else {
    roomCacheMap.clear();
  }
}

module.exports = {
  getCachedRoom,
  invalidateRoomCache
};
