import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export default {
  data: new SlashCommandBuilder()
    .setName("drop")
    .setDescription("ทำลูกอมหล่นให้คนอื่นเก็บ (เฉพาะแอดมิน)")
    .addIntegerOption(opt =>
      opt.setName("จำนวนลูกอม")
        .setDescription("จำนวนลูกอมที่แต่ละคนจะได้รับเมื่อเก็บ")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName("จำนวนคน")
        .setDescription("จำนวนคนที่สามารถเก็บลูกอมได้ทั้งหมด")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName("เวลาหมดอายุ")
        .setDescription("ระยะเวลาให้เก็บได้ (หน่วย: วินาที, ค่าเริ่มต้น 300 วินาที = 5 นาที)")
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(3600)
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has("Administrator")) {
      return interaction.reply({
        content: "⛔ คำสั่งนี้ใช้ได้เฉพาะแอดมินเท่านั้น!",
        ephemeral: true,
      });
    }

    const candyAmount = interaction.options.getInteger("จำนวนลูกอม");
    const maxUsers = interaction.options.getInteger("จำนวนคน");
    const duration = interaction.options.getInteger("เวลาหมดอายุ") || 300;

    const authorMember = await interaction.guild.members.fetch(interaction.user.id);
    const authorName = authorMember.displayName;
    const authorMention = `<@${interaction.user.id}>`;

    const collectedUsers = new Set();

    const button = new ButtonBuilder()
      .setCustomId(`collect_${Date.now()}`)
      .setLabel("เก็บลูกอม 🍬")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    const dropMessage = await interaction.reply({
      content: `🍬 ${authorMention} ทำลูกอมหล่น! เก็บได้คนละ **${candyAmount} เม็ด**  
## มีเพียง **${maxUsers} คนเท่านั้นที่เก็บได้ — รีบเลย!**  
⏰ (หมดเวลาใน ${duration} วินาที)

@here รีบมาเก็บลูกอมเร็ว! 🍬`,
      components: [row],
      allowedMentions: { parse: ["users", "roles", "everyone"] }, // ✅ ให้ mention ทำงานจริง
      fetchReply: true,
    });

    const collector = dropMessage.createMessageComponentCollector({
      time: duration * 1000,
    });

    collector.on("collect", async (i) => {
      const userId = i.user.id;

      if (collectedUsers.size >= maxUsers && !collectedUsers.has(userId)) {
        return i.reply({ content: "🍬 ลูกอมหมดแล้ว!", ephemeral: true });
      }

      if (collectedUsers.has(userId)) {
        return i.reply({ content: "❌ คุณเก็บลูกอมไปแล้ว!", ephemeral: true });
      }

      collectedUsers.add(userId);

      const data = loadData();
      if (!data[userId]) data[userId] = { candies: 0 };
      data[userId].candies += candyAmount;
      saveData(data);

      await i.reply({
        content: `🍬 คุณเก็บลูกอมได้ ${candyAmount} เม็ด!`,
        ephemeral: true,
      });

      if (collectedUsers.size >= maxUsers) {
        collector.stop("done");
      }
    });

    collector.on("end", async (_, reason) => {
      let finalMessage = "";

      if (reason === "done") {
        finalMessage = "🍬 ลูกอมหมดแล้ว!";
      } else {
        finalMessage = "⏰ หมดเวลาในการเก็บลูกอมแล้ว!";
      }

      if (collectedUsers.size > 0) {
        const mentions = [...collectedUsers].map(id => `<@${id}>`).join(", ");
        finalMessage += `\n\n👥 **คนที่เก็บลูกอมได้:** ${mentions}`;
      } else {
        finalMessage += "\n\n😢 ไม่มีใครทันเก็บลูกอมเลย...";
      }

      button.setDisabled(true).setLabel("หมดแล้ว 🍂");
      const disabledRow = new ActionRowBuilder().addComponents(button);
      await dropMessage.edit({ components: [disabledRow] });

      await dropMessage.reply(finalMessage);
    });
  },
};
