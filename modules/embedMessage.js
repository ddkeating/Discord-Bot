const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const cartelEmbeded = ({ fullName, gangName, capProgress, imagePath }) => {
    try {
        const customEmbed = new EmbedBuilder()
        .setColor("DarkOrange")
        .setTitle(fullName)
        .setDescription('Arms cap')
        .addFields(
            { name: 'Gang Name:', value: gangName, inline: true },
            { name: 'Cap Progress:', value: capProgress + "%", inline: true }
        )
        .setImage(imagePath)
        .setTimestamp();
        return customEmbed;
    } catch (error) {
        console.error(error)
    }
}

function warzoneEmbedded({ time, currentGangFunds, user }) {
    try {

        const customEmbed = new EmbedBuilder()
            .setColor("DarkOrange")
            .setTitle("Warzone Logger")
            .addFields(
                { name: 'Gang Funds:', value: '$' + currentGangFunds, inline: true },
                { name: 'Current Time:', value: new Date(time).toLocaleTimeString(), inline: true },
                { name: 'Member:', value: user.displayName}
            )
            .setTimestamp();
        
        const button = new ButtonBuilder()
            .setCustomId('Stop-Capturing')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Primary) // Use ButtonStyle.PRIMARY
        
        // Create a row to contain the button
        const row = new ActionRowBuilder().addComponents(button);

        return { embeds: [customEmbed], components: [row] };
    }
    catch (error) {
        console.error(error);
    }
}

exports.cartelEmbeded = cartelEmbeded;
exports.warzoneEmbedded = warzoneEmbedded;
