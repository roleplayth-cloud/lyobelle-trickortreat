import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "./data.json";
const COOLDOWN_FILE = "./cooldowns.json";

// โหลดข้อมูล
function loadData(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

// บันทึกข้อมูล
function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// คำนวณวันปัจจุบัน (ตัดรอบตี 2 GMT+7) - แก้ไขใหม่
function getTodayKey() {
  const now = new Date();
  // สร้าง Date object ใหม่โดยอิงเวลาจาก Timezone กรุงเทพ
  const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

  // ลดเวลาลง 2 ชั่วโมงเพื่อให้การตัดรอบเวลาทำงานถูกต้อง
  // เช่น:
  // - เวลา 01:59 (วันที่ 3) -> เมื่อ -2 ชั่วโมง จะเป็น 23:59 (วันที่ 2) -> key คือ วันที่ 2
  // - เวลา 02:00 (วันที่ 3) -> เมื่อ -2 ชั่วโมง จะเป็น 00:00 (วันที่ 3) -> key คือ วันที่ 3
  bangkokTime.setHours(bangkokTime.getHours() - 2);

  const year = bangkokTime.getFullYear();
  const month = String(bangkokTime.getMonth() + 1).padStart(2, '0');
  const day = String(bangkokTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// รายชื่อสถานที่
const locations = [
  "De Esmeray",
  "Sanguis House",
  "Haus of Aquaborne",
  "Baines House",
  "Vincent's Base",
  "บ้านเลขที่ 13 บลอสซัมโร้ด",
  "บ้านครอบครัวแอดดัมส์",
  "เรือนแสงรัชนี",
  "LEITH CABIN",
  "White Stone House",
  "ทางเดินระหว่างชั้น Middle Class",
  "ทางเดินระหว่างชั้น Deluxe",
  "ทางเดินระหว่างชั้น Superior",
];

// สถานที่ที่ไปได้ 3 ครั้ง/วัน
const specialLocations = [
  "ทางเดินระหว่างชั้น Middle Class",
  "ทางเดินระหว่างชั้น Deluxe",
  "ทางเดินระหว่างชั้น Superior",
];

export default {
  data: new SlashCommandBuilder()
    .setName("trickortreat")
    .setDescription("ไป Trick or Treat ที่สถานที่ต่าง ๆ เพื่อหาลูกอม!")
    .addStringOption(option =>
      option
        .setName("สถานที่")
        .setDescription("เลือกสถานที่ที่ต้องการไป Trick or Treat")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = locations.filter(l =>
      l.toLowerCase().includes(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.slice(0, 25).map(l => ({ name: l, value: l }))
    );
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const location = interaction.options.getString("สถานที่");
    const data = loadData(DATA_FILE);
    const cooldowns = loadData(COOLDOWN_FILE);

    const todayKey = getTodayKey();
    if (!cooldowns[todayKey]) cooldowns[todayKey] = {};
    if (!cooldowns[todayKey][userId]) cooldowns[todayKey][userId] = {};

    const userCooldowns = cooldowns[todayKey][userId];
    const maxVisits = specialLocations.includes(location) ? 3 : 1;
    const visits = userCooldowns[location] || 0;

    if (visits >= maxVisits && !interaction.memberPermissions?.has("Administrator")) {
      return interaction.reply({
        content: `❌ วันนี้คุณไปที่ **${location}** ครบจำนวนครั้งแล้ว! (ไปได้ ${maxVisits} ครั้งต่อวัน)`,
        ephemeral: true,
      });
    }

    // 🎲 สุ่มลูกอม พร้อมโอกาส 3% ได้โบนัส 20 เม็ด
    let candies;
    let bonus = false;
    if (Math.random() < 0.03) {
      candies = 20;
      bonus = true;
    } else {
      candies = Math.floor(Math.random() * 11);
    }

    // ✅ อัปเดต cooldown
    userCooldowns[location] = visits + 1;
    cooldowns[todayKey][userId] = userCooldowns;
    saveData(COOLDOWN_FILE, cooldowns);

    // ✅ อัปเดตจำนวนลูกอม
    if (!data[userId]) data[userId] = { candies: 0 };
    data[userId].candies += candies;
    saveData(DATA_FILE, data);

    // 🧡 สร้างข้อความตอบกลับ
    let replyMsg;
    if (candies === 0) {
      replyMsg = `😈 คุณไปที่ **${location}** แล้วไม่ได้อะไรเลย สมน้ำหน้า! 🍂`;
    } else if (bonus) {
      replyMsg = `💥 คุณไปที่ **${location}** แล้วเจอปีศาจใจดี!  
มันแจกให้คุณ **${candies} เม็ด!!** 🍭🎉`;
    } else {
      replyMsg = `🎃 คุณไปที่ **${location}** แล้วได้ลูกอม **${candies} เม็ด!** 🍬`;
    }

    await interaction.reply(replyMsg);
  },
};