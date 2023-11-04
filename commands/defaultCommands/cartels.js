const { SlashCommandBuilder } = require('discord.js');
const { updateCartels } = require('../../modules/functions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cartels')
        .setDescription('Shows active warzone caps.'),
    async execute(interaction) {
        await updateCartels(interaction);
    }
}
