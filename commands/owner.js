import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'owner',
        alias: ['creator', 'developer'],
        desc: 'Get Bot Owner details and contact info'
    },
    execute: async (m, sock) => {
        try {
            const jid = m.key.remoteJid
            const ownerNumber = (getSetting('owner.number') || '8801711209381').replace(/\D/g, '')
            const ownerName = getSetting('owner.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'

            // WhatsApp Contact Card (vCard)
            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${ownerName}\n` +
                `ORG:RAHI_MD Bot Owner;\n` +
                `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n` +
                'END:VCARD'

            await sock.sendMessage(jid, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m })

            await sock.sendMessage(jid, {
                text: `👑 *Bot Owner:* ${ownerName}\n📞 *Contact:* https://wa.me/${ownerNumber}`
            }, { quoted: m })

        } catch (error) {
            console.error("Owner Command Error:", error)
            await sock.sendMessage(m.key.remoteJid, { text: '❌ *Failed to send owner information.*' }, { quoted: m })
        }
    }
}
