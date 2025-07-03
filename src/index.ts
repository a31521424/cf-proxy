/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const getReferHost = (host: string) => {
	console.log('host', host);
	switch (host) {
		case 'cdnfile.sspai.com':
			return 'https://sspai.com/';
		case 'bcn.135editor.com':
			return 'https://www.135editor.com';
	}
	return null;

};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname !== '/proxy') {
			return new Response('Not Found', { status: 404 });
		}
		const query = url.searchParams;
		if (query.get('key') !== 'ov8lEYLa8h') {
			return new Response('Not Found', { status: 404 });
		}
		const redirectUrlString = query.get('url');
		if (redirectUrlString) {
			try {
				const redirectUrl = new URL(redirectUrlString);
				const referer = getReferHost(redirectUrl.hostname);
				console.log('referer', referer);
				if (referer !== null) {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

					const response = await fetch(redirectUrlString, {
						headers: {
							'Referer': referer,
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36'
						},
						signal: controller.signal
					});

					clearTimeout(timeoutId);

					// 检查响应状态
					if (!response.ok) {
						return new Response('Upstream error', { status: response.status });
					}

					// 检查内容类型
					const contentType = response.headers.get('content-type');
					if (!contentType || !contentType.startsWith('image/')) {
						return new Response('Not an image', { status: 415 });
					}

					// 转发响应，保留原始headers
					return new Response(response.body, {
						headers: response.headers
					});
				} else {
					return Response.redirect(redirectUrlString);
				}
			} catch (e) {
				return new Response('Invalid redirect URL', { status: 400 });
			}
		}

		return new Response();
	}
} satisfies ExportedHandler<Env>;
