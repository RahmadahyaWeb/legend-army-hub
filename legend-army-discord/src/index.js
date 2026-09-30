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

	const discordPayload = {
		username: 'XKGBOT',

		allowed_mentions: {
			parse: ['everyone', 'roles', 'users'],
		},

		embeds: [
			{
				title: `⚔️ ${title}`,

				description: content,

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

	const { guildLeagueId, name, notes, date, status, rosterUrl, assignedPlayers, maxPlayers, activeTeams, maxTeams } = body;

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

	const normalizedStatus = String(status || 'draft').toLowerCase();

	const statusLabels = {
		draft: 'Draft',
		open: 'Open',
		published: 'Published',
		completed: 'Completed',
		cancelled: 'Cancelled',
	};

	const statusLabel = statusLabels[normalizedStatus] || normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

	const fields = [
		{
			name: '📅 Date',
			value: date,
			inline: false,
		},
		{
			name: '📌 Status',
			value: statusLabel,
			inline: false,
		},
		{
			name: '👥 Roster',
			value: `${Number(assignedPlayers) || 0} / ${Number(maxPlayers) || 60} Players`,
			inline: false,
		},
		{
			name: '🛡️ Teams',
			value: `${Number(activeTeams) || 0} / ${Number(maxTeams) || 12} Teams`,
			inline: false,
		},
	];

	if (notes) {
		fields.push({
			name: '📝 Notes',
			value: String(notes).slice(0, 1024),
			inline: false,
		});
	}

	fields.push({
		name: '🔗 GUILD LEAGUE ROSTER',
		value: `**[VIEW GUILD LEAGUE ROSTER](${rosterUrl})**`,
		inline: false,
	});

	const discordPayload = {
		username: 'XKGBOT',

		content: '@everyone',

		allowed_mentions: {
			parse: ['everyone'],
		},

		embeds: [
			{
				title: `⚔️ ${name}`,

				url: rosterUrl,

				description: [
					`🔗 **[VIEW GUILD LEAGUE ROSTER](${rosterUrl})**`,
					'',
					'**GUILD LEAGUE ROSTER**',
					'',
					'The roster has been updated.',
					'Please check your team and battlefield assignment.',
				].join('\n'),

				color: 15158332,

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
						label: 'View GUILD LEAGUE Roster',
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

	return Response.json(
		{
			success: true,
			message: 'Guild League announcement sent successfully.',
			guildLeagueId,
			rosterUrl,
		},
		{
			status: 200,
			headers: corsHeaders,
		},
	);
}
