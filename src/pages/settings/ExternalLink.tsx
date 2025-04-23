import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";

export function ExternalLink({
	href,
	children,
}: {
	readonly href: string;
	readonly children: React.ReactNode;
}) {
	return (
		<a href={href} target="_blank" rel="noreferrer">
			{children} <FontAwesomeIcon icon={faExternalLink} aria-hidden="true" />
			<span className="sr-only">Opens in new tab</span>
		</a>
	);
}
