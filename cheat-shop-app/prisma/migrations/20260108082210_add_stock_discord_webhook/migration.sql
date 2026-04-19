-- Add stockDiscordWebhook field to settings table
ALTER TABLE `settings` ADD COLUMN `stockDiscordWebhook` TEXT NULL AFTER `discordWebhook`;