import { commands } from '../index.js'
import { getSetting } from '../settings.js'

function runtime(seconds) {
    seconds = Number(seconds) || 0
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
}

export default {
    info: {
        name: 'menu',
        alias: ['help', 'h', 'list'],
        desc: 'Show beautiful aesthetic main menu'
    },
    execute: async (m, sock) => {
        try {
            const prefix = getSetting('bot.prefix') || '.'
            const botName = getSetting('bot.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'
            const ownerName = getSetting('owner.name') || 'RAHI'

            const uniqueCmds = commands ? Array.from(new Set(commands.values())) : []

            const date = new Date().toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
            const time = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })

            // সুন্দর ও প্রিমিয়াম এস্টেটিক থিম
            let text = `
✨ ━━━⟨ 👑 *${botName}* 👑 ⟩━━━ ✨

╭━━━〔 🟡 *𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎* 🟡 〕━━━⬣
┃ 👑 ‣ *Owner*     : ${ownerName}
┃ ⭐ ‣ *Prefix*    : [  ${prefix}  ]
┃ 📦 ‣ *Commands*  : ${uniqueCmds.length} Total
┃ ⏳ ‣ *Uptime*    : ${runtime(process.uptime())}
┃ 📅 ‣ *Date*      : ${date}
┃ ⏰ ‣ *Time*      : ${time}
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 💛 *𝐀𝐋𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 💛 〕━━━⬣\n`

            if (uniqueCmds.length > 0) {
                uniqueCmds.forEach((cmd, idx) => {
                    const num = (idx + 1).toString().padStart(2, '0')
                    const cmdName = cmd?.info?.name || 'unknown'
                    text += `┃ 💎 ❬ *${num}* ❭ 🠮 *${prefix}${cmdName}*\n`
                })
            } else {
                text += `┃ ❌ No commands available.\n`
            }

            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

> 💛 *Powered by ${botName} Official*`

            await sock.sendMessage(m.key.remoteJid, { 
                text: text,
                contextInfo: {
                    externalAdReply: {
                        title: `✨ ${botName} MAIN MENU ✨`,
                        body: "WhatsApp Automated System",
                        thumbnailUrl: "https://i.postimg.cc/05p6KqCc/1768548671157.jpg",
                        sourceUrl: "https://whatsapp.com",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } catch (error) {
            console.error("Menu Command Error:", error)
            await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Menu Error:* " + error.message 
            }, { quoted: m })
        }
    }
}
