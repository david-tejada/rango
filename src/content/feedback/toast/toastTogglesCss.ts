// Ideally this would be a css file that I then import as text from other file.
// The way to do that in Parcel is to use `bundle-text`
// (https://parceljs.org/features/bundle-inlining/). The problem is that if I
// use that some unexisting assets are included in "web_accessible_resources"
// in the manifest, which I then have to manually delete (issue #519).

const css = `
.ToggleStatus {
	display: flex;
	justify-content: space-between;
	font-size: 1em;
	text-transform: none;
	line-height: 1.8;
	min-width: 12em;
}

.ToggleStatus.set ~ .ToggleStatus.set,
.ToggleStatus.unset {
	opacity: 0.7;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}
`;

export default css;
