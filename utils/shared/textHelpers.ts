export const convertHtmlToText = (html: string): string => {
	return html
		.replace(/<html[^>]*>.*?<body[^>]*>/gis, '')
		.replace(/<\/body>.*?<\/html>/gis, '')
		.replace(/<div[^>]*>/gi, '\n')
		.replace(/<\/div>/gi, '')
		.replace(/<p[^>]*>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<h[1-6][^>]*>/gi, '\n')
		.replace(/<\/h[1-6]>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<strong>/gi, '**')
		.replace(/<\/strong>/gi, '**')
		.replace(/<span[^>]*>/gi, '')
		.replace(/<\/span>/gi, '')
		.replace(/<[^>]*>/g, '')
		.replace(/\n\s*\n\s*\n/g, '\n\n')
		.replace(/^\s+|\s+$/g, '')
		.trim();
};
