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

        const uniqueCmds = Array.from(new Set(commands.values()))
        const date = new Date().toLocaleDateString('en-IN')
        const time = new Date().toLocaleTimeString('en-IN')

        let text = `✨ 𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 ${botName} ✨\n\n`
        text += `╭━━━〔 💛 *𝐁𝐎𝐓 𝐈𝐍𝐅𝐎* 💛 〕━━━⬣\n`
        text += `┃ 🔱 *Owner* : ${ownerName}\n`
        text += `┃ ⭐ *Prefix* : [ ${prefix} ]\n`
        text += `┃ 📦 *Commands* : ${uniqueCmds.length}\n`
        text += `┃ ⏳ *Uptime* : ${runtime(process.uptime())}\n`
        text += `┃ 📅 *Date* : ${date}\n`
        text += `┃ ⏰ *Time* : ${time}\n`
        text += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`

        text += `╭━━━〔 🟡 *𝐀𝐋𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 🟡 〕━━━⬣\n`

        uniqueCmds.forEach((cmd, idx) => {
            const num = (idx + 1).toString().padStart(2, '0')
            text += `┃ 🗂️ ❬ *${num}* ❭ ❯ *${prefix}${cmd.info.name}*\n`
        })

        text += `╰━━━━━━━━━━━━━━━━━━━━━⬣\n\n`
        text += `> 💛 *Powered by ${botName} Official*`

        await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
    }
            }
