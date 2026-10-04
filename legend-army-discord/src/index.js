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
		activeTeams,
		maxTeams,
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

	const normalizedStatus = String(status || 'draft').toLowerCase();

	const statusLabels = {
		draft: 'Draft',
		open: 'Open / Preparing',
		published: 'Published',
		completed: 'Completed',
		cancelled: 'Cancelled',
	};

	const statusLabel = statusLabels[normalizedStatus] || normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
	const totalAssigned = Number(assignedPlayers) || 0;
	const totalCapacity = isPolarity ? 50 : (Number(maxPlayers) || 60);
	const fillPercentage = Math.round((totalAssigned / (totalCapacity || 1)) * 100);

	// Why this exists: Tailors field names and battle context specifically to the event format
	const fields = [];

	// Field 1: Event/Match/War Date
	fields.push({
		name: isWoe ? '📅 War Date' : isPolarity ? '📅 Event Date' : '📅 Match Date',
		value: `**${date}**`,
		inline: true,
	});

	// Field 2: Target / Opponent
	fields.push({
		name: isWoe
			? '🏰 Target Castle / Objective'
			: isPolarity
			? '🎯 Objective / Arena'
			: '⚔️ Opponent Guild',
		value: opponent ? `**${opponent}**` : isWoe ? '*Prontera Castle / TBA*' : isPolarity ? '*Polarity Sanctuary / TBA*' : '*TBA*',
		inline: true,
	});

	// Field 3: Status
	fields.push({
		name: isWoe ? '📌 War Status' : '📌 Match Status',
		value: `**${statusLabel}**`,
		inline: true,
	});

	// Field 4: Capacity
	fields.push({
		name: '👥 Roster Capacity',
		value: `${totalAssigned} / ${totalCapacity} Players (${fillPercentage}%)`,
		inline: true,
	});

	// Field 5: Team Formations
	fields.push({
		name: isPolarity ? '🛡️ Squad Structure' : isWoe ? '🛡️ Squad Formations' : '🛡️ Team Formations',
		value: isPolarity
			? `${Number(activeTeams) || 10} / 10 Teams (5 Players/Team)`
			: `${Number(activeTeams) || 0} / ${Number(maxTeams) || 12} Teams`,
		inline: true,
	});

	// Field 6: Tactical Mode Badge
	fields.push({
		name: isPolarity ? '💠 Battle Mode' : isWoe ? '🏰 Siege Mode' : '⚔️ Lane Format',
		value: isPolarity
			? 'Fixed 10 Parties (50 Players Max)'
			: isWoe
			? 'Unified Formations (No Lane Division)'
			: '3 Tactical Lanes (Top, Mid, Bot)',
		inline: true,
	});

	if (notes && String(notes).trim()) {
		fields.push({
			name: '📝 Tactical Notes / Briefing',
			value: String(notes).slice(0, 1024),
			inline: false,
		});
	}

	// Add team overview if teams data is available
	if (Array.isArray(teams) && teams.length > 0) {
		const activeTeamsList = teams.filter((t) => (t.members && t.members.length > 0) || t.memberCount > 0);
		if (activeTeamsList.length > 0) {
			const teamLines = activeTeamsList.slice(0, isPolarity ? 10 : 8).map((t) => {
				const count = t.members ? t.members.length : (t.memberCount || 0);
				if (isPolarity) {
					return `• **Party ${t.teamNumber}: ${t.name || `Party ${t.teamNumber}`}** (${count}/5 players)`;
				}
				if (isWoe) {
					return `• **${t.name || `Squad ${t.teamNumber}`}** (${count} players)`;
				}
				const laneText = t.lane ? ` • *Lane: ${t.lane}*` : '';
				return `• **${t.name || `Team ${t.teamNumber}`}** (${count} players)${laneText}`;
			});

			const limit = isPolarity ? 10 : 8;
			if (activeTeamsList.length > limit) {
				teamLines.push(`*...and ${activeTeamsList.length - limit} more teams*`);
			}

			fields.push({
				name: isPolarity ? '📋 Deployed Parties Breakdown' : '📋 Deployed Teams Breakdown',
				value: teamLines.join('\n').slice(0, 1024),
				inline: false,
			});
		}
	}

	// Field: Public Roster link
	fields.push({
		name: '🌐 Public Roster Portal',
		value: isPolarity
			? `👉 **[Click Here to Open Polarity Roster](${rosterUrl})**\n*Interactive view with 10 party compositions, element synergy, and live gear scores.*`
			: isWoe
			? `👉 **[Click Here to Open WOE Siege Roster](${rosterUrl})**\n*Interactive view with castle siege squads, barricade defense, and player gear scores.*`
			: `👉 **[Click Here to Open Public Roster](${rosterUrl})**\n*Interactive view with live class composition, gear scores, and lane assignments.*`,
		inline: false,
	});

	// Embed Header Description & Color tailoring
	const embedConfig = isPolarity
		? {
				title: `💠 [POLARITY] 10-Team Formation: ${name}`,
				color: 2339316, // Cyan / Aqua
				description: [
					'📢 **Polarity Protocol Active!**',
					`The fixed 10-team lineup (5 players per squad, 50 players capacity) for **${name}** is locked in!`,
					'',
					`🔗 **[👉 View Live Public Roster & Strategy](${rosterUrl})**`,
					'',
					'🌀 Please coordinate element attunement, party buff synergies, and objective assignments before battle!',
				].join('\n'),
				buttonLabel: 'View Polarity Roster 💠',
		  }
		: isWoe
		? {
				title: `🏰 [WAR OF EMPERIUM] Siege Roster: ${name}`,
				color: 15844367, // Gold / Amber
				description: [
					'📢 **Sound the Horns, Guild Members!**',
					`The War of Emperium (WOE) castle siege and defense roster for **${name}** has been assembled!`,
					'',
					`🔗 **[👉 View Live Public Roster & Strategy](${rosterUrl})**`,
					'',
					'🏰 Review your squad assignment, Emperium assault teams, castle barricade defense, and supplies!',
				].join('\n'),
				buttonLabel: 'View WOE Siege Roster 🏰',
		  }
		: {
				title: `⚔️ [GUILD LEAGUE] Lineup & Tactics: ${name}`,
				color: 15158332, // Crimson / Red
				description: [
					'📢 **Attention Guild Members!**',
					`The tactical lineup for **${name}** has been updated on our guild hub.`,
					'',
					`🔗 **[👉 View Live Public Roster & Strategy](${rosterUrl})**`,
					'',
					'⚔️ Please check your team slot, lane assignment (Top / Mid / Bot), and gear requirements before match time.',
				].join('\n'),
				buttonLabel: 'View Guild League Roster ⚔️',
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
