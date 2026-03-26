/**
 * Stock image provider for resort rooms
 * Uses Unsplash API for high-quality, free stock images
 */

const UNSPLASH_IMG_BASE =
  "https://images.unsplash.com/photo-";

// Premium resort/hotel room stock photo IDs from Unsplash
const ROOM_IMAGES: Record<string, string[]> = {
  // Luxury Suite / High-end rooms
  suite: [
    "1631049307295-46c8b0fb1d5d?w=800&h=600&fit=crop", // Modern luxury bedroom
    "1566195992212-04d54f3ce947?w=800&h=600&fit=crop", // Contemporary hotel suite
    "1593062096033-8fb86f96f88d?w=800&h=600&fit=crop", // Bedroom with city view
    "1578751494554-cebbb53d3601?w=800&h=600&fit=crop", // Modern bed design
  ],
  // Deluxe Room
  deluxe: [
    "1520250884060-45be3e43e06d?w=800&h=600&fit=crop", // Elegant bedroom
    "1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", // Modern hotel room
    "1516455207290-5cabc6f31e46?w=800&h=600&fit=crop", // Sea view bedroom
    "1578751494554-cebbb53d3601?w=800&h=600&fit=crop", // Premium bedroom design
  ],
  // Standard Room
  standard: [
    "1631049307295-46c8b0fb1d5d?w=800&h=600&fit=crop", // Clean hotel room
    "1566195992212-04d54f3ce947?w=800&h=600&fit=crop", // Comfortable bedroom
    "1493857672505-493967b15338?w=800&h=600&fit=crop", // Minimalist room
    "1540932239986-310128078ceb?w=800&h=600&fit=crop", // Modern bedroom
  ],
  // Beach/Ocean View
  ocean: [
    "1591088895550-8ebf4417c5f6?w=800&h=600&fit=crop", // Beach view room
    "1618646403238-e92a22e2fecf?w=800&h=600&fit=crop", // Ocean view suite
    "1546693492-221e0c5d83ce?w=800&h=600&fit=crop", // Coastal bedroom
    "1522159884908-ac4a7f4f55a1?w=800&h=600&fit=crop", // Water view room
  ],
  // Garden View
  garden: [
    "1493857671505-493957b15338?w=800&h=600&fit=crop", // Garden view room
    "1550581190-7282082655e4?w=800&h=600&fit=crop", // Nature view bedroom
    "1547432537-f1e0422874d7?w=800&h=600&fit=crop", // Botanical garden view
    "1516455207290-5cabc6f31e46?w=800&h=600&fit=crop", // Green view suite
  ],
  // Pool View
  pool: [
    "1552321554-5fefe8c9ef14?w=800&h=600&fit=crop", // Resort pool view
    "1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", // Pool access room
    "1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop", // Poolside suite
    "1584622650111-993a426fbf0a?w=800&h=600&fit=crop", // Modern resort room
  ],
  // Lagoon View
  lagoon: [
    "1604537529494-c2d0d01e6c86?w=800&h=600&fit=crop", // Tropical lagoon view
    "1618646403238-e92a22e2fecf?w=800&h=600&fit=crop", // Water bungalow
    "1591088895550-8ebf4417c5f6?w=800&h=600&fit=crop", // Lagoon access
    "1600585152915-be9635b9b447?w=800&h=600&fit=crop", // Island resort room
  ],
  // Mountain View
  mountain: [
    "1571896619870-bc8f40cfaf1f?w=800&h=600&fit=crop", // Mountain vista room
    "1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // Alpine bedroom
    "1519803742494-2307cd61244e?w=800&h=600&fit=crop", // Mountain view suite
    "1492684223066-81342ee5ff30?w=800&h=600&fit=crop", // Peak view room
  ],
  // Default/Fallback
  default: [
    "1631049307295-46c8b0fb1d5d?w=800&h=600&fit=crop",
    "1567198704882-faf94968e536?w=800&h=600&fit=crop",
    "1616594520390-f7fbbaf8c3ee?w=800&h=600&fit=crop",
    "1522159884908-ac4a7f4f55a1?w=800&h=600&fit=crop",
  ],
};

/**
 * Get a consistent stock image URL for a room
 * Uses room ID to deterministically select from pool of images
 */
export function getRoomImageUrl(
  roomId: number,
  roomType?: string,
  viewType?: string,
): string {
  // Prefer view-based images first
  let category = "default";
  
  if (viewType) {
    const normView = viewType.toLowerCase();
    if (normView in ROOM_IMAGES) category = normView;
  } else if (roomType) {
    const normType = roomType.toLowerCase();
    if (normType in ROOM_IMAGES) category = normType;
  }

  const images = ROOM_IMAGES[category];
  const index = roomId % images.length;
  return UNSPLASH_IMG_BASE + images[index];
}

/**
 * Get multiple stock images for gallery (4 images per room)
 */
export function getRoomImageGallery(
  roomId: number,
  roomType?: string,
  viewType?: string,
  apiPhotos?: string[],
): string[] {
  if (apiPhotos && apiPhotos.length > 0) {
    return apiPhotos;
  }

  let category = "default";
  
  if (viewType) {
    const normView = viewType.toLowerCase();
    if (normView in ROOM_IMAGES) category = normView;
  } else if (roomType) {
    const normType = roomType.toLowerCase();
    if (normType in ROOM_IMAGES) category = normType;
  }

  const images = ROOM_IMAGES[category];
  const startIdx = roomId % images.length;
  
  // Return 4 different images from the category
  return [0, 1, 2, 3].map((i) => UNSPLASH_IMG_BASE + images[(startIdx + i) % images.length]);
}

/**
 * Get photos for a room from API response or generate fallback
 */
export function getRoomPhotos(
  roomId: number,
  roomType?: string,
  viewType?: string,
  apiPhotos?: string[],
): string[] {
  // If API provided photos, use them
  if (apiPhotos && apiPhotos.length > 0) {
    return apiPhotos;
  }
  
  // Otherwise generate stock images
  return getRoomImageGallery(roomId, roomType, viewType);
}

/**
 * Get primary image for room (for thumbnails/lists)
 */
export function getRoomThumbnail(
  roomId: number,
  roomType?: string,
  viewType?: string,
  apiPhotos?: string[],
): string {
  const photos = getRoomPhotos(roomId, roomType, viewType, apiPhotos);
  return photos[0];
}
