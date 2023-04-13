type ToastMessageProps = {
	text: string;
};

export function ToastMessage({ text }: ToastMessageProps) {
	return (
		<div>
			<h6>Rango</h6>
			<p>{text}</p>
		</div>
	);
}
