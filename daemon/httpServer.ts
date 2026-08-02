import { z } from "zod";
import type { ExtensionBridge } from "./extensionBridge";

const zCommandRequest = z.object({
	action: z.object({ name: z.string() }).passthrough(),
});

export function createHttpServer(bridge: ExtensionBridge) {
	return Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		async fetch(request) {
			const url = new URL(request.url);

			if (url.pathname === "/health" && request.method === "GET") {
				return Response.json({
					ok: true,
					pid: process.pid,
					extensionConnected: bridge.connected,
				});
			}

			if (url.pathname === "/command" && request.method === "POST") {
				let body: unknown;
				try {
					body = await request.json();
				} catch {
					return Response.json(
						{ success: false, error: "Invalid JSON body." },
						{ status: 400 }
					);
				}

				const parsed = zCommandRequest.safeParse(body);
				if (!parsed.success) {
					return Response.json(
						{ success: false, error: "Expected { action: { name, ...} }." },
						{ status: 400 }
					);
				}

				if (!bridge.connected) {
					return Response.json(
						{
							success: false,
							error:
								"No extension connected. Make sure Rango is loaded in a browser and has connected to the daemon.",
						},
						{ status: 503 }
					);
				}

				const result = await bridge.send(parsed.data.action);
				return Response.json(result, { status: result.success ? 200 : 502 });
			}

			return new Response("Not found", { status: 404 });
		},
	});
}

export type RangoDaemonHttpServer = ReturnType<typeof createHttpServer>;
