import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("ดูอันดับผู้ที่มีกลูกอมมากที่สุด"),

  async execute(interaction) {
    // ✅ ป้องกัน timeout ด้วยการ defer reply ก่อน
    await interaction.deferReply();

    const data = loadData();
    const sorted = Object.entries(data)
      .sort((a, b) => b[1].candies - a[1].candies)
      .slice(0, 10);

    if (sorted.length === 0) {
      return interaction.editReply("ยังไม่มีใครสะสมลูกอมเลย 🎃");
    }

    const leaderboard = await Promise.all(
      sorted.map(async ([id, info], i) => {
        try {
          // ✅ ใช้ชื่อเล่นในเซิร์ฟเวอร์
          const member = await interaction.guild.members.fetch(id);
          const displayName = member.displayName || member.user.username;
          return `**${i + 1}.** ${displayName} — 🍬 ${info.candies} เม็ด`;
        } catch {
          // ✅ ถ้าออกจากเซิร์ฟเวอร์แล้ว
          const user = await interaction.client.users.fetch(id).catch(() => null);
          const name = user ? user.username : "👻 ออกจากเซิร์ฟแล้ว";
          return `**${i + 1}.** ${name} — 🍬 ${info.candies} เม็ด`;
        }
      })
    );

    await interaction.editReply(
      `🏆 **อันดับสะสมลูกอมสูงสุดในเซิร์ฟเวอร์** 🏆\n\n${leaderboard.join("\n")}`
    );
  },
};
