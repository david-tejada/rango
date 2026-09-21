/**
 * A request for a label for a particular element, sent from the content script
 * to the background script when caching labels.
 */
export type LabelRequest = {
	/**
	 * An id that identifies the element within the batch of requests. It is only
	 * used to match the response back to the element that requested it.
	 */
	id: string;

	/**
	 * The normalized visible text of the element, used to find a label that can
	 * be rendered by underlining two of its characters. It is `undefined` for
	 * elements without usable text, which always get a regular hint.
	 */
	text?: string;

	/**
	 * The length of the leading part of `text` a label should come from if one
	 * is available there. See `UnderlineText`.
	 */
	preferredLength?: number;
};

/**
 * The result of claiming labels from the stack.
 */
export type ClaimedLabels = {
	/**
	 * The labels that matched the text of a request, keyed by the request id.
	 * Requests with no text, or whose text didn't produce any available label,
	 * are absent.
	 */
	assigned: Record<string, string>;

	/**
	 * Labels claimed that aren't tied to any particular request. They are used
	 * for the elements that couldn't be assigned a matching label.
	 */
	unassigned: string[];
};
