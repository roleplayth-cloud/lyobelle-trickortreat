import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

import trickOrTreat from "./commands/trickortreat.js";
import balance from "./commands/balance.js";
import leaderboard from "./commands/leaderboard.js";
import resetcandies from "./commands/resetcandies.js";
import drop from "./commands/drop.js";
import dropdivide from "./commands/dropdivide.js"; // ✅ เพิ่ม dropdivide command

dotenv.config();

const commands = [
  trickOrTreat.data.toJSON(),
  balance.data.toJSON(),
  leaderboard.data.toJSON(),
  resetcandies.data.toJSON(),
  drop.data.toJSON(),
  dropdivide.data.toJSON(), // ✅ เพิ่มตรงนี้
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function deploy() {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Commands registered successfully!");
  } catch (err) {
    console.error("❌ Error deploying commands:", err);
  }
}

deploy();
