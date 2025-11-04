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

// 🎲 เวอร์ชันใหม่ ป้องกันคนได้ 0 เม็ด
function randomDivide(total, parts) {
  if (parts <= 1) return [total];

  // แจกขั้นต่ำ 1 เม็ดให้ทุกคนก่อน
  const base = Array(parts).fill(1);
  let remaining = total - parts;

  // ถ้ายอดรวมไม่พอแจกขั้นต่ำ
  if (remaining < 0) {
    base[0] += total - 1;
    return base;
  }

  // สุ่มแจกส่วนที่เหลือ
  for (let i = 0; i < remaining; i++) {
    const randomIndex = Math.floor(Math.random() * parts);
    base[randomIndex]++;
  }

  return base;
}

export default {
  data: new SlashCommandBuilder()
    .setName("dropdivide")
    .setDescription("ทำลูกอมหล่นแบบสุ่มจำนวนต่อคน (เฉพาะแอดมิน)")
    .addIntegerOption(opt =>
      opt.setName("จำนวนลูกอมรวม")
        .setDescription("จำนวนลูกอมทั้งหมดที่จะหล่น")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .addIntegerOption(opt =>
      opt.setName("จำนวนคน")
        .setDescription("จำนวนคนที่สามารถเก็บได้ทั้งหมด")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName("เวลาหมดอายุ")
        .setDescription("ระยะเวลาให้เก็บได้ (หน่วย: วินาที, ค่าเริ่มต้น 300)")
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

    const totalCandies = interaction.options.getInteger("จำนวนลูกอมรวม");
    const maxUsers = interaction.options.getInteger("จำนวนคน");
    const duration = interaction.options.getInteger("เวลาหมดอายุ") || 300;

    const authorMember = await interaction.guild.members.fetch(interaction.user.id);
    const authorName = authorMember.displayName;
    const authorMention = `<@${interaction.user.id}>`;

    const dividedCandies = randomDivide(totalCandies, maxUsers);
    const collectedUsers = new Map();

    const button = new ButtonBuilder()
      .setCustomId(`collectdiv_${Date.now()}`)
      .setLabel("เก็บลูกอม 🍬")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    const dropMessage = await interaction.reply({
      content: `🍬 ${authorMention} ทำลูกอมหล่นทั้งหมด **${totalCandies} เม็ด!**  
มีเพียง **${maxUsers} คนเท่านั้นที่เก็บได้ โดยจะหารจากจำนวนรวมนะ — รีบเลย!**  
⏰ (หมดเวลาใน ${duration} วินาที)

@here รีบมาเก็บลูกอมเร็ว! 🍬`,
      components: [row],
      allowedMentions: { parse: ["users", "everyone", "roles"] },
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

      const candyAmount = dividedCandies[collectedUsers.size] || 0;
      collectedUsers.set(userId, candyAmount);

      const data = loadData();
      if (!data[userId]) data[userId] = { candies: 0 };
      data[userId].candies += candyAmount;
      saveData(data);

      await i.reply({
        content: `🍬 คุณเก็บลูกอมได้ **${candyAmount} เม็ด!**`,
        ephemeral: true,
      });

      if (collectedUsers.size >= maxUsers) collector.stop("done");
    });

    collector.on("end", async (_, reason) => {
      let finalMessage = "";

      if (reason === "done") {
        finalMessage = "🍬 ลูกอมหมดแล้ว!";
      } else {
        finalMessage = "⏰ หมดเวลาในการเก็บลูกอมแล้ว!";
      }

      if (collectedUsers.size > 0) {
        const results = [...collectedUsers.entries()]
          .map(([id, amount]) => `<@${id}> ได้ ${amount} เม็ด`)
          .join("\n");
        const totalGiven = [...collectedUsers.values()].reduce((a, b) => a + b, 0);

        finalMessage += `\n\n🎁 **สรุปผลรอบนี้:**\n${results}\n\nรวมแจกไปทั้งหมด ${totalGiven} เม็ด!`;
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
