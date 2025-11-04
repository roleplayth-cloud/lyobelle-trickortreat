import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";

import trickOrTreat from "./commands/trickortreat.js";
import balance from "./commands/balance.js";
import leaderboard from "./commands/leaderboard.js";
import resetcandies from "./commands/resetcandies.js";
import drop from "./commands/drop.js";
import dropdivide from "./commands/dropdivide.js"; // ✅ เพิ่ม dropdivide command

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ✅ โหลดคำสั่งทั้งหมด
client.commands.set(trickOrTreat.data.name, trickOrTreat);
client.commands.set(balance.data.name, balance);
client.commands.set(leaderboard.data.name, leaderboard);
client.commands.set(resetcandies.data.name, resetcandies);
client.commands.set(drop.data.name, drop);
client.commands.set(dropdivide.data.name, dropdivide); // ✅ เพิ่มตรงนี้

// ✅ เมื่อบอทออนไลน์
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ เมื่อมี interaction (เช่น slash command หรือ autocomplete)
client.on("interactionCreate", async (interaction) => {
  try {
    // Autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      await command.autocomplete(interaction);
      return;
    }

    // Slash command ปกติ
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Command error:`, err);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "⚠️ เกิดข้อผิดพลาดขึ้น โปรดลองอีกครั้ง!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "⚠️ เกิดข้อผิดพลาดขึ้น โปรดลองอีกครั้ง!",
          ephemeral: true,
        });
      }
    } catch (replyErr) {
      console.error("❌ Failed to send error message:", replyErr);
    }
  }
});

client.login(process.env.TOKEN);
