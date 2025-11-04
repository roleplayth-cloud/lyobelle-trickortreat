import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";

export default {
  data: new SlashCommandBuilder()
    .setName("resetcandies")
    .setDescription("รีเซ็ตลูกอมทั้งหมดของทุกคน (เฉพาะแอดมิน)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // ป้องกันพลาด: ยืนยันสิทธิ์แอดมิน
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "⛔ คำสั่งนี้ใช้ได้เฉพาะแอดมินเท่านั้น!",
        ephemeral: true,
      });
    }

    // แจ้ง Discord ว่ากำลังประมวลผล (ป้องกัน timeout)
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!fs.existsSync(DATA_FILE)) {
        await interaction.editReply("📁 ไม่มีไฟล์ข้อมูลให้รีเซ็ต");
        return;
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));

      await interaction.editReply("🎃 ข้อมูลลูกอมทั้งหมดถูกรีเซ็ตเรียบร้อยแล้ว!");
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ เกิดข้อผิดพลาดระหว่างรีเซ็ตข้อมูล!");
    }
  },
};
