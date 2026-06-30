import axios from "axios";

export default {
  info: { 
    name: "bot", 
    alias: ["sim"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    // ctx না থাকলে এরর এড়াতে fallback ব্যবহার করা হয়েছে
    const jid = ctx?.jid || m.key.remoteJid;
    const senderJid = ctx?.senderJid || m.key.participant || m.key.remoteJid;
    const usermsg = args.join(" ");

    // ১. Updated Greeting Logic (নতুন এবং মজাদার সব মেসেজ)
    if (!usermsg) {
      const greetings = [
        "কি গো সোনা, আমাকে এভাবে ডাকছ কেন? বলো, কি সেবা করতে পারি? 😉",
        "আমি রাহির এআই বট! কি খবর তোমার? দিনকাল কেমন যাচ্ছে? ✨",
        "আরেহ, আমাকে এতো না ডেকে বস রাহিকে একটা ভালো দেখে গফ (Girlfriend) খুঁজে দাও না! 🙄",
        "আসসালামু আলাইকুম! আমি তোমার ডিজিটাল সঙ্গী। নতুন কিছু শিখতে চাও নাকি আড্ডা দিবে? 😊",
        "হুম বলো, কি রহস্য নিয়ে এসেছ আজ? আমি নয়নের বানানো স্মার্ট এআই! 🤖✨",
        "বলো জান, তোমার মনে কি দুশ্চিন্তা? শেয়ার করতে পারো আমার সাথে। 😇",
        "তোমার মেসেজের অপেক্ষায়ই ছিলাম! আজ কি মজার কথা হবে বলো? 🌸",
        "আমি তো তোমার সেবায় নিয়োজিত! কোন বিষয়ে হেল্প লাগবে বলো তো? 🚀",
        "আমাকে না ডেকে রাহিকে একটু শান্তিতে ঘুমাতে দাও, তার বদলে আমার সাথে গল্প করো! 😂",
        "তুমি কি জানো? আমাকে রাহি খুব যত্ন করে বানিয়েছে, তাই আমি খুব স্মার্ট! 😎"
      ];
      
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      return await sock.sendMessage(jid, { 
        text: `@${senderJid.split('@')[0]}, ${randomGreeting}`, 
        mentions: [senderJid] 
      }, { quoted: m });
    }

    // ২. AI Chat Logic (API Call)
    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
      
      const { data: configData } = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-OFFICIAL/Nayan/main/api.json");
      const apiUrl = configData.api;

      const res = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(usermsg)}&number=${senderJid.split('@')[0]}`);
      const reply = res.data.data?.msg || "🤖 দুঃখিত, আমি বুঝতে পারিনি।";

      await sock.sendMessage(jid, { text: reply }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (err) {
      console.error("AI Error:", err);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: "❌ সার্ভারে সমস্যা হচ্ছে, পরে আবার চেষ্টা করুন।" }, { quoted: m });
    }
  }
};
