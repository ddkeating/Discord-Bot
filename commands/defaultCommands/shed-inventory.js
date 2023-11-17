const { SlashCommandBuilder } = require("discord.js");
const { shedInventory } = require("../../modules/functions");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shed-inventory")
		.setDescription(
			"Displays a list of the current physical and virtual inventory."
		),
	async execute(interaction) {
		await shedInventory(interaction, false);
	},
};
