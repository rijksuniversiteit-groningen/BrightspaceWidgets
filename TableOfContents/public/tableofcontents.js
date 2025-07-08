window.addEventListener('DOMContentLoaded', () => {
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

	Promise.all([
		fetch(`/d2l/api/le/1.85/${window.orgUnitId}/content/toc`).then(r => r.json()),
		fetch(`/d2l/api/le/1.85/${window.orgUnitId}/content/completions/mycount/?level=2`).then(r => r.json()),
	])
		.then(([toc, completions]) => {
			completions = completions?.status === 403 ? [] : completions.Objects;
			if (toc.Modules.length === 0) {
				tocElement.innerText = lang.noContent;
			} else {
				for (const module of toc.Modules) {
					const completionData = completions.find(c => c.ObjectId === module.ModuleId);
					renderModule(module, completionData);
				}
			}
		})
		.catch((error) => {
			tocElement.innerText = lang.error;
			console.error(error);
		});
	
	function renderModule(module, completionData) {
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
			const percentage = completionData === undefined || completionData.RequiredItems === 0
				? 0
				: 100 * completionData.CompletedItems / completionData.RequiredItems;

			const progContainer = document.createElement('span');
			progContainer.id = `prog${module.ModuleId}`;
			progContainer.className = 'label-center';
			if (percentage === 0) {
				progContainer.classList.add('empty');
			}
			generateProgressBar(progContainer, percentage);
			
			row.appendChild(progContainer);
		}
	}
	
	function generateProgressBar(element, percentage) {
		new ldBar(element, {
			preset: 'circle',
			value: percentage,
			precision: '1',
			stroke: '#3970bf',
			'stroke-trail': '#e4e8f1',
			'stroke-trail-width': 12,
			'stroke-width': 12
		});
	}
});
