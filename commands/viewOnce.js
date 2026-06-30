import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  info: { 
    name: "viewonce", 
    alias: ["vv", "view"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid } = ctx;
    
    // ১. কোটেড মেসেজ চেক করা
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await sock.sendMessage(jid, { text: '⚠️ দয়া করে কোনো মিডিয়া মেসেজের ওপর রিপ্লাই দিয়ে কমান্ডটি লিখুন।' }, { quoted: m });
    }

    // ২. মিডিয়া টাইপ এবং মেসেজ এক্সট্র্যাক্ট করা
    let type = Object.keys(quoted)[0];
    let actualMessage = quoted;

    // যদি ViewOnce হয়
    if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
      actualMessage = quoted[type].message;
      type = Object.keys(actualMessage)[0];
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      // ৩. মিডিয়া ডাউনলোড (Buffer হিসেবে)
      const buffer = await downloadMediaMessage(
        { message: { [type]: actualMessage[type] } },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      // ৪. মিডিয়া পাঠানো
      const messageType = type.replace('Message', '').toLowerCase(); // image, video, audio
      
      await sock.sendMessage(jid, {
        [messageType]: buffer,
        caption: '✅ এই নিন আপনার মিডিয়া!'
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (err) {
      console.error('VV Command Error:', err);
      await sock.sendMessage(jid, { text: '❌ মিডিয়াটি ডাউনলোড করা সম্ভব হয়নি। এটি হতে পারে সাধারণ চ্যাট নয়।' }, { quoted: m });
    }
  }
};
