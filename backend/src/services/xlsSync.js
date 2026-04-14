// services/xlsSync.js
import xlsx from "xlsx";
import path from "path";
import cron from "node-cron";
import Property from "../models/Property.js";
import Room from "../models/Room.js";

const SYNC_CRON = process.env.SYNC_CRON || "0 */6 * * *";

export async function syncFromXLS() {
  console.log("[xlsSync] Sync started");

  // Read env vars inside the function so dotenv has already run
  const COL = {
    NAME: process.env.COL_NAME || "groupName",
    AREA: process.env.COL_AREA || "area",
    GENDER: process.env.COL_GENDER || "gender",
    SINGLE_PRICE: process.env.COL_SINGLE_PRICE || "singlePrice",
    DOUBLE_PRICE: process.env.COL_DOUBLE_PRICE || "doublePrice",
    TRIPLE_PRICE: process.env.COL_TRIPLE_PRICE || "triplePrice",
  };

  const DATA_PATH = process.env.XLS_FILE_PATH
    ? path.resolve(process.env.XLS_FILE_PATH)
    : null;

  if (!DATA_PATH) {
    console.warn("[xlsSync] XLS_FILE_PATH is not set in .env — skipping sync.");
    return;
  }

  try {
    // Step 1 — Read CSV/XLS file
    const workbook = xlsx.readFile(DATA_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let propertiesUpserted = 0;
    let roomsUpserted = 0;
    const skipped = [];

    // Step 2 — Parse and upsert each row
    for (const row of rows) {
      const name = row[COL.NAME]?.toString().trim();
      const area = row[COL.AREA]?.toString().trim();

      if (!name || !area) {
        skipped.push({ row, reason: "Missing name or area" });
        continue;
      }

      // Build property data from all available CSV columns
      const propertyData = {
        name,
        area,
        gender: row[COL.GENDER]?.toString().trim().toLowerCase() || "unisex",
        food: row.food?.toString().trim().toLowerCase() === 'yes' || !!row.meals?.toString().trim(),
        ...(row.locality && { locality: row.locality.toString().trim() }),
        ...(row.landmarks && { landmarks: row.landmarks.toString().trim() }),
        ...(row.propertyType && { propertyType: row.propertyType.toString().trim().toLowerCase() }),
        ...(row.amenities && {
          amenities: row.amenities.toString().split(",").map(s => s.trim()).filter(Boolean)
        }),
        ...(row.safety && { safety: row.safety.toString().trim() }),
        ...(row.commonAreas && { commonAreas: row.commonAreas.toString().trim() }),
        ...(row.meals && { meals: row.meals.toString().trim() }),
        ...(row.vibe && { vibe: row.vibe.toString().trim() }),
        ...(row.walkDist && { walkDist: row.walkDist.toString().trim() }),
        ...(row.utilities && { utilities: row.utilities.toString().trim() }),
        ...(row.deposit && { deposit: row.deposit.toString().trim() }),
        ...(row.minStay && { minStay: row.minStay.toString().trim() }),
        ...(row.houseRules && { houseRules: row.houseRules.toString().trim() }),
        ...(row.mapsLink && { mapsLink: row.mapsLink.toString().trim() }),
        ...(row.driveLink && { driveLink: row.driveLink.toString().trim() }),
        ...(row.usp && { usp: row.usp.toString().trim() }),
        ...(row.priority && {
          priority: ["super urgent", "push", "normal"].includes(row.priority.toString().trim().toLowerCase())
            ? row.priority.toString().trim().toLowerCase()
            : "normal"
        }),
        ...(row.targetAudience && { targetAudience: row.targetAudience.toString().trim() }),
        ...(row.ownerCode && { ownerCode: row.ownerCode.toString().trim() }),
        ...(row.managerName && { managerName: row.managerName.toString().trim() }),
        ...(row.managerContact && { managerContact: row.managerContact.toString().trim() }),
        ...(row.nblr !== undefined && { nblr: ['true','yes','1'].includes(row.nblr?.toString().trim().toLowerCase()) }),
        // zoneId skipped — requires ObjectId lookup, set manually
      };
      // Step 3 — Upsert Property
      const property = await Property.findOneAndUpdate(
        { name: propertyData.name, area: propertyData.area },
        { $set: propertyData },
        { upsert: true, returnDocument: "after", runValidators: false }
      );
      propertiesUpserted++;

      // Step 4 — Upsert Rooms for each price tier present
      const roomTypes = [
        { col: COL.SINGLE_PRICE, type: "single" },
        { col: COL.DOUBLE_PRICE, type: "double" },
        { col: COL.TRIPLE_PRICE, type: "triple" },
      ];

      for (const { col, type } of roomTypes) {
        const priceRaw = row[col];
        if (priceRaw !== undefined && priceRaw !== null && priceRaw !== "") {
          const price = Number(priceRaw);
          if (!isNaN(price) && price > 0) {
            await Room.findOneAndUpdate(
              { propertyId: property._id, roomType: type },
              { $set: { price } },
              { upsert: true, returnDocument: "after" }
            );
            roomsUpserted++;
          }
        }
      }
    }

    // Step 5 — Log summary
    console.log(`[xlsSync] Rows read:               ${rows.length}`);
    console.log(`[xlsSync] Properties upserted:     ${propertiesUpserted}`);
    console.log(`[xlsSync] Rooms upserted:          ${roomsUpserted}`);
    if (skipped.length > 0) {
      console.warn(`[xlsSync] Rows skipped: ${skipped.length}`);
      skipped.forEach(({ reason }, i) =>
        console.warn(`  Row ${i + 1}: ${reason}`)
      );
    }
  } catch (err) {
    console.error("[xlsSync] Sync failed:", err);
  }

  console.log("[xlsSync] Sync complete");
}

// Schedule recurring sync
cron.schedule(SYNC_CRON, syncFromXLS);

// Run once on startup
syncFromXLS();