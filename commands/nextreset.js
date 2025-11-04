import { SlashCommandBuilder } from "discord.js";

function getNextResetTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bangkok = new Date(utc + 7 * 60 * 60 * 1000);

  // ถ้าเลยตี 2 แล้ว → ไปตี 2 ของวันถัดไป
  let reset = new Date(bangkok);
  reset.setHours(2, 0, 0, 0);
  if (bangkok.getHours() >= 2) {
    reset.setDate(reset.getDate() + 1);
  }

  const diffMs = reset - bangkok;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { reset, hours, minutes };
}

export default {
  data: new SlashCommandBuilder()
    .setName("nextreset")
    .setDescription("ดูเวลาที่ระบบจะรีเซ็ตสิทธิ์ตี 2 (GMT+7)"),
  async execute(interaction) {
    const { reset, hours, minutes } = getNextResetTime();
    await interaction.reply({
      content: `🕑 รอบใหม่จะเริ่มในอีก **${hours} ชั่วโมง ${minutes} นาที**\n(เวลารีเซ็ต: <t:${Math.floor(
        reset.getTime() / 1000
      )}:F>)`,
      ephemeral: true,
    });
  },
};
