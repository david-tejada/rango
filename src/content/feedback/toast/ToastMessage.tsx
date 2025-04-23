type ToastMessageProps = {
	readonly children: React.ReactNode;
};

export function ToastMessage({ children }: ToastMessageProps) {
	return (
		<div className="ToastMessage">
			<h2>
				Rango<span className="sr-only"> notifier:</span>
			</h2>
			{children}
			<footer>
				<code>dismiss</code> to close
			</footer>
		</div>
	);
}
