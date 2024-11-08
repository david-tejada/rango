import type { ActionMap } from "../../typings/Action";
import type { TalonAction } from "../../typings/RequestFromTalon";

type CommandHandler = (
	args: ActionMap[keyof ActionMap]
) => Promise<undefined | TalonAction | TalonAction[] | "noResponse">;

const commandHandlers = new Map<keyof ActionMap, CommandHandler>();

export function onCommand<T extends keyof ActionMap>(
	name: T,
	handler: (
		args: ActionMap[T]
	) => Promise<void | TalonAction | TalonAction[] | "noResponse">
) {
	if (commandHandlers.has(name)) {
		throw new Error("Only one command handler per command can be registered.");
	}

	commandHandlers.set(name, handler as CommandHandler);
}

export async function handleCommand<Name extends keyof ActionMap>(
	name: Name,
	args: ActionMap[keyof ActionMap]
) {
	const commandHandler = commandHandlers.get(name);
	if (!commandHandler) throw new Error(`Command "${name}" doesn't exist.`);

	return commandHandler(args);
}
