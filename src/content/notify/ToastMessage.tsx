type ToastMessageProps = {
	children: React.ReactNode;
};

export function ToastMessage({ children }: ToastMessageProps) {
	return (
		<div className="ToastMessage">
			<h2>Rango</h2>
			{children}
			<footer>
				To close say <code>dismiss</code>
			</footer>
		</div>
	);
}
