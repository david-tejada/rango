import type { ActionMap } from "../../typings/Action";
import type { TalonAction } from "../../typings/TalonAction";

type CommandHandler<T extends keyof ActionMap> = (
	args: ActionMap[T]
) => Promise<undefined | TalonAction | TalonAction[] | "noResponse">;

const commandHandlers = new Map<
	keyof ActionMap,
	CommandHandler<keyof ActionMap>
>();

export function onCommand<T extends keyof ActionMap>(
	name: T,
	handler: CommandHandler<T>
) {
	if (commandHandlers.has(name)) {
		throw new Error("Only one command handler per command can be registered.");
	}

	commandHandlers.set(name, handler as CommandHandler<keyof ActionMap>);
}

export async function handleCommand<T extends keyof ActionMap>(
	name: T,
	args: ActionMap[T]
) {
	const commandHandler = commandHandlers.get(name);
	if (!commandHandler) throw new Error(`Command "${name}" doesn't exist.`);

	return commandHandler(args);
}
