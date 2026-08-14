import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'antilink',
        alias: ['linkprotection'],
        desc: 'Turn Anti-Link system on/off or set to kick'
    },
    execute: async (m, sock, args) => {
        try {
            const jid = m.key.remoteJid
            if (!jid.endsWith('@g.us')) {
                return await sock.sendMessage(jid, { text: '❌ *This command can only be used in groups!*' }, { quoted: m })
            }

            const groupMetadata = await sock.groupMetadata(jid)
            const sender = m.key.participant || m.key.remoteJid
            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin

            if (!senderAdmin && !m.key.fromMe) {
                return await sock.sendMessage(jid, { text: '❌ *Only Group Admins can toggle Anti-Link!*' }, { quoted: m })
            }

            const mode = args[0]?.toLowerCase()

            if (!global.antilinkMode) global.antilinkMode = {}

            if (mode === 'on') {
                global.antilinkMode[jid] = 'delete'
                await sock.sendMessage(jid, { text: '✅ *Anti-Link Enabled!* (Action: Delete Message)' }, { quoted: m })
            } else if (mode === 'kick') {
                global.antilinkMode[jid] = 'kick'
                await sock.sendMessage(jid, { text: '🚨 *Anti-Link Active!* (Action: Delete Message & Kick Member)' }, { quoted: m })
            } else if (mode === 'off') {
                global.antilinkMode[jid] = 'off'
                await sock.sendMessage(jid, { text: '❌ *Anti-Link Disabled!*' }, { quoted: m })
            } else {
                await sock.sendMessage(jid, { 
                    text: '⚠️ *Usage:* \n.antilink on\n.antilink kick\n.antilink off' 
                }, { quoted: m })
            }

        } catch (error) {
            console.error("Anti-Link Error:", error)
            await sock.sendMessage(m.key.remoteJid, { text: '❌ *Failed to update Anti-Link status.*' }, { quoted: m })
        }
    }
                                   }
