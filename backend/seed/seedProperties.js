// seed/seedProperties.js
// One-time bootstrapping script — destructive, dev-only.
// Run: node seed/seedProperties.js
// Never run in production once real data exists.

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Property from "../src/models/Property.js";
import Room from "../src/models/Room.js";

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit path — seed/ folder is NOT the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ---------------------------------------------------------------------------
// SEED DATA
// ---------------------------------------------------------------------------

const propertiesData = [
  {
    name: "Sunrise PG",
    area: "Koramangala",
    city: "Bangalore",
    gender: "female",
    type: "pg",
    urgency: "super urgent",
    food: true,
    nblr: false,
    address: "12, 5th Block, Koramangala, Bangalore - 560034",
    landmark: "Near Forum Mall",
    contactName: "Meena Sharma",
    contactPhone: "9876543210",
  },
  {
    name: "Blue Ridge Hostel",
    area: "Indiranagar",
    city: "Bangalore",
    gender: "male",
    type: "hostel",
    urgency: "push",
    food: false,
    nblr: false,
    address: "45, 100 Feet Road, Indiranagar, Bangalore - 560038",
    landmark: "Near Indiranagar Metro",
    contactName: "Ramesh Nair",
    contactPhone: "9845012345",
  },
  {
    name: "Urban Nest",
    area: "HSR Layout",
    city: "Bangalore",
    gender: "unisex",
    type: "pg",
    urgency: "priority",
    food: true,
    nblr: false,
    address: "7, Sector 2, HSR Layout, Bangalore - 560102",
    landmark: "Near BDA Complex",
    contactName: "Priya Reddy",
    contactPhone: "9900112233",
  },
  {
    name: "Green Valley PG",
    area: "Marathahalli",
    city: "Bangalore",
    gender: "male",
    type: "pg",
    urgency: "super urgent",
    food: true,
    nblr: true, // nblr: true — should be excluded by match engine
    address: "33, Outer Ring Road, Marathahalli, Bangalore - 560037",
    landmark: "Near Wipro Office",
    contactName: "Suresh Kumar",
    contactPhone: "9123456789",
  },
  {
    name: "The Residency",
    area: "Whitefield",
    city: "Bangalore",
    gender: "unisex",
    type: "hostel",
    urgency: "push",
    food: false,
    nblr: false,
    address: "88, ITPL Main Road, Whitefield, Bangalore - 560066",
    landmark: "Near ITPL Gate 1",
    contactName: "Anjali Menon",
    contactPhone: "9988776655",
  },
];

// propertyName + propertyArea = lookup key to resolve propertyId after insert
// These fields are NOT part of the Room schema — seed-time references only
const roomsData = [
  // Sunrise PG (female, Koramangala)
  {
    propertyName: "Sunrise PG",
    propertyArea: "Koramangala",
    roomType: "single",
    price: 12000,
    vacancies: 2,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },
  {
    propertyName: "Sunrise PG",
    propertyArea: "Koramangala",
    roomType: "double",
    price: 8500,
    vacancies: 1,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },

  // Blue Ridge Hostel (male, Indiranagar)
  {
    propertyName: "Blue Ridge Hostel",
    propertyArea: "Indiranagar",
    roomType: "dormitory",
    price: 5500,
    vacancies: 4,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },
  {
    propertyName: "Blue Ridge Hostel",
    propertyArea: "Indiranagar",
    roomType: "single",
    price: 10000,
    vacancies: 1,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },

  // Urban Nest (unisex, HSR Layout)
  {
    propertyName: "Urban Nest",
    propertyArea: "HSR Layout",
    roomType: "double",
    price: 9000,
    vacancies: 3,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },
  {
    propertyName: "Urban Nest",
    propertyArea: "HSR Layout",
    roomType: "triple",
    price: 6500,
    vacancies: 2,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },

  // Green Valley PG (male, Marathahalli, nblr: true)
  {
    propertyName: "Green Valley PG",
    propertyArea: "Marathahalli",
    roomType: "single",
    price: 11000,
    vacancies: 1,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },

  // The Residency (unisex, Whitefield)
  {
    propertyName: "The Residency",
    propertyArea: "Whitefield",
    roomType: "double",
    price: 8000,
    vacancies: 5,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },
  {
    propertyName: "The Residency",
    propertyArea: "Whitefield",
    roomType: "single",
    price: 13000,
    vacancies: 2,
    availability: { availabilityType: "immediate" },
    retail: { retailStatus: "open" },
  },
];

// ---------------------------------------------------------------------------
// SEED FUNCTION
// ---------------------------------------------------------------------------

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Step 1 — Clear existing data
    await Property.deleteMany({});
    await Room.deleteMany({});
    console.log("Cleared existing properties and rooms");

    // Step 2 — Insert properties
    const insertedProperties = await Property.insertMany(propertiesData);
    console.log(`Properties seeded: ${insertedProperties.length}`);

    // Step 3 — Resolve propertyId for each room using name + area lookup
    const roomsToInsert = roomsData.map((room) => {
      const { propertyName, propertyArea, ...roomFields } = room;

      const matchedProperty = insertedProperties.find(
        (p) => p.name === propertyName && p.area === propertyArea
      );

      if (!matchedProperty) {
        throw new Error(
          `Could not resolve property for room: "${propertyName}" in "${propertyArea}". ` +
            `Check that propertyName and propertyArea match propertiesData exactly.`
        );
      }

      return {
        ...roomFields,
        propertyId: matchedProperty._id,
      };
    });

    // Step 4 — Insert rooms
    const insertedRooms = await Room.insertMany(roomsToInsert);
    console.log(`Rooms seeded: ${insertedRooms.length}`);

    // Step 5 — Clean exit
    await mongoose.disconnect();
    console.log("Seed complete");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run immediately
seed();