import { commands } from '../index.js'
import { getSetting } from '../settings.js'

function runtime(seconds) {
    seconds = Number(seconds)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
}

export default {
    info: {
        name: 'menu',
        alias: ['help', 'h'],
        desc: 'Show all commands'
    },
    execute: async (m, sock) => {
        const prefix = getSetting('bot.prefix')
        const botName = getSetting('bot.name')
        const ownerName = getSetting('owner.name')

        // কমান্ডগুলোকে ক্যাটাগরি অনুযায়ী সাজানোর জন্য একটি অবজেক্ট
        const categories = {
            ADMIN: [],
            MEDIA: [],
            FUN: [],
            OTHER: []
        };

        commands.forEach(cmd => {
            const cat = (cmd.info.category || 'OTHER').toUpperCase();
            if (categories[cat]) categories[cat].push(cmd.info.name);
            else categories['OTHER'].push(cmd.info.name);
        });

        const date = new Date().toLocaleDateString('en-IN')
        const time = new Date().toLocaleTimeString('en-IN')

        let text = `╭━━━〔 ${botName} 〕━━━⬣
┃ ✦ Owner : ${ownerName}
┃ ✦ Prefix : ${prefix}
┃ ✦ Runtime : ${runtime(process.uptime())}
┃ ✦ Date : ${date}
┃ ✦ Time : ${time}
╰━━━━━━━━━━━━━━⬣\n\n`;

        // ক্যাটাগরি অনুযায়ী লুপ চালানো
        for (const cat in categories) {
            if (categories[cat].length > 0) {
                text += `╭─❍ ${cat} MENU ❍─╮\n`;
                categories[cat].forEach(cmd => {
                    text += `┃ ${prefix}${cmd}\n`;
                });
                text += `╰━━━━━━━━━━━━━━⬣\n\n`;
            }
        }

        text += `> developer rahi`;

        await sock.sendMessage(m.key.remoteJid, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "𝑹𝑨𝑯𝑰_𝑴𝑫 Control Center",
                    body: "Professional WhatsApp Bot",
                    thumbnailUrl: "https://i.postimg.cc/05p6KqCc/1768548671157.jpg",
                    sourceUrl: "https://github.com/RAHIOFFCIALS506/RAHI_MD",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
    }
}
