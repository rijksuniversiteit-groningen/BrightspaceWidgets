window.addEventListener('DOMContentLoaded', (loadEvent) => {
	const terms = {
		en: {
			noContent: 'This course has no content currently available.',
			error: 'Could not load Table of Contents.',
			locale: 'en-EN'
		},
		nl: {
			noContent: 'Er is momenteel geen inhoud beschikbaar in deze cursus.',
			error: 'Kon de inhoudsopgave niet laden.',
			locale: 'nl-NL',
		}
	}

	window.hideProgressBar = window.hideProgressBar || false
	
	const lang = document.documentElement.lang.startsWith('nl') ? terms.nl : terms.en;
	const tocElement = document.getElementById('tableOfContents');

	fetch(`/d2l/api/le/1.41/${window.orgUnitId}/content/toc`)
		.then((response) => response.json())
		.then((data) => {
			if (data.Modules.length === 0) {
				tocElement.innerText = lang.noContent;
			}
			else {
				for (const module of data.Modules) {
					renderModule(module);
				}
			}
		})
		.catch((error) => {
			tocElement.innerText = lang.error;
			console.error(error);
	});
	
	function getCompletionRatio(module) {
		const validTopics = module.Topics.filter(topic => !topic.IsBroken);
		
		let total = validTopics.length;
		let read = validTopics.filter(topic => !topic.Unread).length;

		for (const subModule of module.Modules) {
			const subRatio = getCompletionRatio(subModule);
			total += subRatio.total;
			read += subRatio.read;
		}

		return { read: read, total: total };
	}
	
	function renderModule(module) {
		const ratio = getCompletionRatio(module);
		
		const row = document.createElement('div');
		row.className = 'tocRow';
		
		const tocLink = document.createElement('a');
		tocLink.href = `/d2l/le/lessons/${window.orgUnitId}/units/${module.ModuleId}`;
		tocLink.target = '_top';
		tocLink.innerText = module.Title;
		if (module.Description.Text && module.Description.Text != '') {
			tocLink.title = module.Description.Text;
		}

		row.appendChild(tocLink);
		tocElement.appendChild(row);

		if (!window.hideProgressBar) {
			const progContainer = document.createElement('span');
			progContainer.id = `prog${module.ModuleId}`;
			progContainer.className = 'label-center';
			if (ratio.read === 0) {
				progContainer.classList.add('empty');
			}
			generateProgressBar(progContainer, 100 * ratio.read / ratio.total);
			
			row.appendChild(progContainer);
		}
	}
	
	function generateProgressBar(element, percentage) {
		new ldBar(element, {
			preset: 'circle',
			value: percentage,
			precision: '0.1',
			stroke: '#3970bf',
			'stroke-trail': '#e4e8f1',
			'stroke-trail-width': 8,
			'stroke-width': 8
		});
	}
});
