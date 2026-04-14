import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import matchRoutes from "./routes/match.routes.js";
import leadRoutes from "./routes/leads.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import zoneRoutes from "./routes/zones.routes.js";
import roomRoutes from "./routes/rooms.routes.js";

dotenv.config();
connectDB().then(() => {
    import("./services/xlsSync.js");
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => res.send("Gharpayy API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));