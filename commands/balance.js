import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("ดูจำนวนลูกอมที่คุณสะสมไว้"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const data = loadData();
    const candies = data[userId]?.candies || 0;

    await interaction.reply(`🍫 คุณมีลูกอมทั้งหมด **${candies} เม็ด**`);
  },
};
