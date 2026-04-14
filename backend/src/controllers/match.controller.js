import Property from "../models/Property.js";
import Room from "../models/Room.js";

export const matchProperties = async (req, res) => {
  try {
    const { area, gender, maxBudget, food, propertyType, notes } = req.body;

    if (!area) {
      return res.status(400).json({ message: "Area is required" });
    }

    // ─── PASS 1 — Hard Filters ────────────────────────────────────────────────

    const propertyQuery = {
      area: { $regex: new RegExp(`^${area}$`, "i") },
      $or: [{ nblr: false }, { nblr: { $exists: false } }],
    };

    if (gender) {
      propertyQuery.$and = [
        { $or: [{ gender: "unisex" }, { gender: gender }] },
      ];
    }

    const candidateProperties = await Property.find(propertyQuery).lean();

    const survivedProperties = [];

    for (const property of candidateProperties) {
      const roomQuery = {
        propertyId: property._id,
        "availability.availabilityType": { $ne: "not available" },
        "retail.retailStatus": "open",
      };

      if (maxBudget !== undefined && maxBudget !== null) {
        roomQuery.price = { $lte: maxBudget };
      }

      const qualifyingRooms = await Room.find(roomQuery).lean();

      if (qualifyingRooms.length === 0) continue;

      survivedProperties.push({ ...property, _qualifyingRooms: qualifyingRooms });
    }

    if (survivedProperties.length === 0) {
      return res.status(200).json([]);
    }

    // ─── PASS 2 — Scoring ─────────────────────────────────────────────────────

    const notesWords = notes
      ? notes.toLowerCase().split(/\s+/).filter(Boolean)
      : [];

    const scoredProperties = survivedProperties.map((property) => {
      let matchScore = 0;
      const rooms = property._qualifyingRooms;

      // Budget / room type scoring — highest applicable only
      const hasTriple = rooms.some((r) => r.roomType === "triple");
      const hasDouble = rooms.some((r) => r.roomType === "double");
      const hasSingle = rooms.some((r) => r.roomType === "single");

      if (hasTriple) matchScore += 20;
      else if (hasDouble) matchScore += 15;
      else if (hasSingle) matchScore += 10;

      // Priority scoring
      if (property.priority === "super urgent") matchScore += 20;
      else if (property.priority === "push") matchScore += 12;
      else if (property.priority === "normal") matchScore += 6;

      // Food scoring
      if (food !== undefined && food !== null && property.food === food) {
        matchScore += 15;
      }

      // Property type scoring
      if (propertyType && property.propertyType === propertyType) {
        matchScore += 10;
      }

      // Notes keyword scoring
      if (notesWords.length > 0) {
        const propertyText = [
          property.usp ?? "",
          property.vibe ?? "",
          Array.isArray(property.amenities)
            ? property.amenities.join(" ")
            : (property.amenities ?? ""),
        ]
          .join(" ")
          .toLowerCase();

        let keywordBonus = 0;
        for (const word of notesWords) {
          if (word && propertyText.includes(word)) {
            keywordBonus += 5;
            if (keywordBonus >= 20) break;
          }
        }

        matchScore += Math.min(keywordBonus, 20);
      }

      const { _qualifyingRooms, ...propertyFields } = property;

      return {
        ...propertyFields,
        matchScore,
        availableRooms: _qualifyingRooms,
      };
    });

    // ─── PASS 3 — Sort and Return ─────────────────────────────────────────────

    scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json(scoredProperties);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};