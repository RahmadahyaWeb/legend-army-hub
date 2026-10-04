export default {
	async fetch(request, env) {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		if (request.method !== 'POST') {
			return Response.json(
				{
					success: false,
					message: 'Method not allowed.',
				},
				{
					status: 405,
					headers: corsHeaders,
				},
			);
		}

		try {
			if (!env.DISCORD_WEBHOOK_URL) {
				throw new Error('DISCORD_WEBHOOK_URL is not configured.');
			}

			const url = new URL(request.url);

			/*
            |--------------------------------------------------------------------------
            | STRATEGY
            |--------------------------------------------------------------------------
            */

			if (url.pathname === '/strategy') {
				return await handleStrategy(request, env, corsHeaders);
			}

			/*
            |--------------------------------------------------------------------------
            | GUILD LEAGUE
            |--------------------------------------------------------------------------
            |
            | Endpoint lama tetap dipertahankan agar tombol Send to Discord
            | pada Guild League tetap bekerja seperti sebelumnya.
            |
            */

			return await handleGuildLeague(request, env, corsHeaders);
		} catch (error) {
			console.error('Worker error:', error);

			return Response.json(
				{
					success: false,
					message: error?.message || 'Internal server error.',
				},
				{
					status: 500,
					headers: corsHeaders,
				},
			);
		}
	},
};

/*
|--------------------------------------------------------------------------
| STRATEGY HANDLER
|--------------------------------------------------------------------------
*/

async function handleStrategy(request, env, corsHeaders) {
	const body = await request.json();

	const title = String(body.title || '').trim();
	const content = String(body.content || '').trim();

	if (!title || !content) {
		return Response.json(
			{
				success: false,
				message: 'Strategy title and content are required.',
			},
			{
				status: 422,
				headers: corsHeaders,
			},
		);
	}

	/*
    |--------------------------------------------------------------------------
    | Discord Embed Limits
    |--------------------------------------------------------------------------
    |
    | Embed title       : 256 characters
    | Embed description : 4096 characters
    |
    */

	if (title.length > 256) {
		return Response.json(
			{
				success: false,
				message: 'Strategy title is too long. Maximum 256 characters.',
			},
			{
				status: 422,
				headers: corsHeaders,
			},
		);
	}

	if (content.length > 4096) {
		return Response.json(
			{
				success: false,
				message: 'Strategy content is too long. Maximum 4096 characters.',
			},
			{
				status: 422,
				headers: corsHeaders,
			},
		);
	}

	const category = String(body.category || '').trim();
	const mapName = String(body.mapName || '').trim();

	const fields = [];
	if (category) {
		fields.push({
			name: '📁 Category',
			value: `**${category}**`,
			inline: true,
		});
	}
	if (mapName) {
		fields.push({
			name: '🗺️ Map / Arena',
			value: `**${mapName}**`,
			inline: true,
		});
	}

	const discordPayload = {
		username: 'XKGBOT',

		allowed_mentions: {
			parse: ['everyone', 'roles', 'users'],
		},

		embeds: [
			{
				title: `⚔️ ${title}`,

				description: content,

				fields: fields.length > 0 ? fields : undefined,

				color: 15158332,

				footer: {
					text: 'XKGBOT • Legend Army Guild Hub',
				},

				timestamp: new Date().toISOString(),
			},
		],
	};

	const discordResponse = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
		method: 'POST',

		headers: {
			'Content-Type': 'application/json',
		},

		body: JSON.stringify(discordPayload),
	});

	if (!discordResponse.ok) {
		const discordError = await discordResponse.text();

		console.error('Discord strategy webhook error:', {
			status: discordResponse.status,
			response: discordError,
		});

		return Response.json(
			{
				success: false,
				message: 'Discord webhook rejected the strategy.',
				discordStatus: discordResponse.status,
				discordError,
			},
			{
				status: 502,
				headers: corsHeaders,
			},
		);
	}

	return Response.json(
		{
			success: true,
			message: 'Strategy sent to Discord successfully.',
		},
		{
			status: 200,
			headers: corsHeaders,
		},
	);
}

/*
|--------------------------------------------------------------------------
| GUILD LEAGUE HANDLER
|--------------------------------------------------------------------------
*/

async function handleGuildLeague(request, env, corsHeaders) {
	const body = await request.json();

	const {
		guildLeagueId,
		name,
		opponent,
		notes,
		date,
		status,
		rosterUrl,
		assignedPlayers,
		maxPlayers,
		teams,
		eventType = 'guild_league',
	} = body;

	if (!guildLeagueId || !name || !date || !rosterUrl) {
		return Response.json(
			{
				success: false,
				message: 'Missing Guild League data.',
			},
			{
				status: 422,
				headers: corsHeaders,
			},
		);
	}

	const normalizedType = String(eventType || 'guild_league').toLowerCase().trim();
	const isWoe = normalizedType === 'woe';
	const isPolarity = normalizedType === 'polarity';
	const totalAssigned = Number(assignedPlayers) || 0;
	const totalCapacity = isPolarity ? 50 : (Number(maxPlayers) || 60);
	const fillPercentage = Math.round((totalAssigned / (totalCapacity || 1)) * 100);

	// Why this exists: Simple and direct lineup broadcast without unnecessary flavor text per user request
	const fields = [];

	if (isPolarity) {
		// POLARITY: Cukup bagikan lineup 10 tim
		fields.push({
			name: '📅 Tanggal',
			value: `**${date}**`,
			inline: true,
		});

		fields.push({
			name: '👥 Total Roster',
			value: `${totalAssigned} / 50 Pemain (${fillPercentage}%)`,
			inline: true,
		});

		if (notes && String(notes).trim()) {
			fields.push({
				name: '📝 Catatan',
				value: String(notes).slice(0, 1024),
				inline: false,
			});
		}

		if (Array.isArray(teams) && teams.length > 0) {
			const activeTeamsList = teams.filter((t) => (t.members && t.members.length > 0) || t.memberCount > 0);
			if (activeTeamsList.length > 0) {
				const teamLines = activeTeamsList.slice(0, 10).map((t) => {
					const count = t.members ? t.members.length : (t.memberCount || 0);
					return `• **Party ${t.teamNumber}: ${t.name || `Party ${t.teamNumber}`}** (${count}/5 pemain)`;
				});

				fields.push({
					name: '📋 Pembagian Lineup (10 Tim)',
					value: teamLines.join('\n').slice(0, 1024),
					inline: false,
				});
			}
		}

		fields.push({
			name: '🌐 Link Roster',
			value: `👉 **[Klik untuk Buka Lineup Roster Lengkap](${rosterUrl})**`,
			inline: false,
		});
	} else if (isWoe) {
		// WOE: Cukup bagikan lineup squad
		fields.push({
			name: '📅 Tanggal',
			value: `**${date}**`,
			inline: true,
		});

		if (opponent && String(opponent).trim()) {
			fields.push({
				name: '🏰 Target Kastil',
				value: `**${opponent}**`,
				inline: true,
			});
		}

		fields.push({
			name: '👥 Total Roster',
			value: `${totalAssigned} / ${totalCapacity} Pemain (${fillPercentage}%)`,
			inline: true,
		});

		if (notes && String(notes).trim()) {
			fields.push({
				name: '📝 Catatan',
				value: String(notes).slice(0, 1024),
				inline: false,
			});
		}

		if (Array.isArray(teams) && teams.length > 0) {
			const activeTeamsList = teams.filter((t) => (t.members && t.members.length > 0) || t.memberCount > 0);
			if (activeTeamsList.length > 0) {
				const teamLines = activeTeamsList.slice(0, 12).map((t) => {
					const count = t.members ? t.members.length : (t.memberCount || 0);
					return `• **${t.name || `Team ${t.teamNumber}`}** (${count} pemain)`;
				});

				if (activeTeamsList.length > 12) {
					teamLines.push(`*...dan ${activeTeamsList.length - 12} tim lainnya*`);
				}

				fields.push({
					name: '📋 Pembagian Lineup',
					value: teamLines.join('\n').slice(0, 1024),
					inline: false,
				});
			}
		}

		fields.push({
			name: '🌐 Link Roster',
			value: `👉 **[Klik untuk Buka Lineup Roster Lengkap](${rosterUrl})**`,
			inline: false,
		});
	} else {
		// GUILD LEAGUE: Lineup 3 Lane
		fields.push({
			name: '📅 Tanggal Match',
			value: `**${date}**`,
			inline: true,
		});

		fields.push({
			name: '⚔️ Lawan',
			value: opponent ? `**${opponent}**` : '*TBA*',
			inline: true,
		});

		fields.push({
			name: '👥 Total Roster',
			value: `${totalAssigned} / ${totalCapacity} Pemain (${fillPercentage}%)`,
			inline: true,
		});

		if (notes && String(notes).trim()) {
			fields.push({
				name: '📝 Catatan',
				value: String(notes).slice(0, 1024),
				inline: false,
			});
		}

		if (Array.isArray(teams) && teams.length > 0) {
			const activeTeamsList = teams.filter((t) => (t.members && t.members.length > 0) || t.memberCount > 0);
			if (activeTeamsList.length > 0) {
				const teamLines = activeTeamsList.slice(0, 8).map((t) => {
					const count = t.members ? t.members.length : (t.memberCount || 0);
					const laneText = t.lane ? ` • *Lane: ${t.lane}*` : '';
					return `• **${t.name || `Team ${t.teamNumber}`}** (${count} pemain)${laneText}`;
				});

				if (activeTeamsList.length > 8) {
					teamLines.push(`*...dan ${activeTeamsList.length - 8} tim lainnya*`);
				}

				fields.push({
					name: '📋 Pembagian Lineup (3 Lane)',
					value: teamLines.join('\n').slice(0, 1024),
					inline: false,
				});
			}
		}

		fields.push({
			name: '🌐 Link Roster',
			value: `👉 **[Klik untuk Buka Lineup Roster Lengkap](${rosterUrl})**`,
			inline: false,
		});
	}

	// Embed Header Description & Color tailoring
	const embedConfig = isPolarity
		? {
				title: `💠 Lineup Polarity: ${name}`,
				color: 2339316, // Cyan / Aqua
				description: [
					'📢 **Lineup Polarity telah diperbarui.**',
					'Silakan cek pembagian tim dan slot kalian:',
					`🔗 **[👉 Lihat Lineup Roster](${rosterUrl})**`,
				].join('\n'),
				buttonLabel: 'Lihat Lineup Roster 💠',
		  }
		: isWoe
		? {
				title: `🏰 Lineup War of Emperium: ${name}`,
				color: 15844367, // Gold / Amber
				description: [
					'📢 **Lineup WOE telah diperbarui.**',
					'Silakan cek pembagian squad dan slot kalian:',
					`🔗 **[👉 Lihat Lineup Roster](${rosterUrl})**`,
				].join('\n'),
				buttonLabel: 'Lihat Lineup Roster 🏰',
		  }
		: {
				title: `⚔️ Lineup Guild League: ${name}`,
				color: 15158332, // Crimson / Red
				description: [
					'📢 **Lineup Guild League telah diperbarui.**',
					'Silakan periksa lane assignment (Top/Mid/Bot) dan slot kalian:',
					`🔗 **[👉 Lihat Lineup Roster](${rosterUrl})**`,
				].join('\n'),
				buttonLabel: 'Lihat Lineup Roster ⚔️',
		  };

	const discordPayload = {
		username: 'XKGBOT',

		content: '@everyone',

		allowed_mentions: {
			parse: ['everyone'],
		},

		embeds: [
			{
				title: embedConfig.title,

				url: rosterUrl,

				description: embedConfig.description,

				color: embedConfig.color,

				fields,

				footer: {
					text: 'XKGBOT • Legend Army Guild Hub',
				},

				timestamp: new Date().toISOString(),
			},
		],

		components: [
			{
				type: 1,

				components: [
					{
						type: 2,
						style: 5,
						label: embedConfig.buttonLabel,
						url: rosterUrl,
					},
				],
			},
		],
	};

	const discordResponse = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
		method: 'POST',

		headers: {
			'Content-Type': 'application/json',
		},

		body: JSON.stringify(discordPayload),
	});

	if (!discordResponse.ok) {
		const discordError = await discordResponse.text();

		console.error('Discord webhook error:', {
			status: discordResponse.status,
			response: discordError,
		});

		return Response.json(
			{
				success: false,
				message: 'Discord webhook rejected the request.',
				discordStatus: discordResponse.status,
				discordError,
			},
			{
				status: 502,
				headers: corsHeaders,
			},
		);
	}

	const eventSuccessName = isPolarity ? 'Polarity' : isWoe ? 'War of Emperium' : 'Guild League';

	return Response.json(
		{
			success: true,
			message: `${eventSuccessName} announcement sent successfully.`,
			guildLeagueId,
			rosterUrl,
		},
		{
			status: 200,
			headers: corsHeaders,
		},
	);
}
