export default {
    info: {
        name: 'setname',
        alias: ['setsubject', 'groupname'],
        desc: 'Change group subject/name'
    },
    execute: async (m, sock) => {
        try {
            if (!m.key.remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ *This command can only be used in groups!*' }, { quoted: m })
            }

            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
            const newName = text.split(' ').slice(1).join(' ')

            if (!newName) {
                return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ *Please provide a new group name!*\n\n*Example:* `.setname My Cool Group`' }, { quoted: m })
            }

            await sock.groupUpdateSubject(m.key.remoteJid, newName)
            await sock.sendMessage(m.key.remoteJid, { text: `✅ *Group name updated to:* "${newName}"` }, { quoted: m })

        } catch (error) {
            console.error("SetName Error:", error)
            await sock.sendMessage(m.key.remoteJid, { text: '❌ *Error:* I need to be a **Group Admin** to change the group name!' }, { quoted: m })
        }
    }
}
