window.addEventListener('load', (loadEvent) => {
	const terms = {
		en: {
			courseLabel: 'Course code:',
			courseStatusLabel: 'Course is',
			altInactive: 'Inactive course',
			altActive: 'Active course',
			altHelp: 'Help on how to make your course active or inactive',
			statusUnknown: '(status unknown)',
			activeAfter: 'active after',
			inactiveSince: 'inactive since',
			activeUntil: 'active until',
			active: 'active',
			inactive: 'inactive and not visible to students',
			locale: 'en-EN'
		},
		nl: {
			courseLabel: 'Cursuscode:',
			courseStatusLabel: 'Cursus is',
			altInactive: 'Inactieve cursus',
			altActive: 'Actieve cursus',
			altHelp: 'Hulp bij het actief of inactief maken van uw cursus',
			statusUnknown: '(status onbekend)',
			activeAfter: 'actief na',
			inactiveSince: 'inactief sinds',
			activeUntil: 'actief tot',
			active: 'actief',
			inactive: 'inactief en niet zichtbaar voor studenten',
			locale: 'nl-NL',
		}
	}

	const statusElem = document.getElementById('courseActiveStatus');
	const statusImg = document.getElementById('courseStatusImg');

	const lang = document.documentElement.lang.startsWith('nl') ? terms.nl : terms.en;

	document.getElementById('courseLabel').innerText = lang.courseLabel;
	document.getElementById('courseStatusLabel').innerText = lang.courseStatusLabel;
	document.getElementById('help').title = lang.altHelp;


	fetch('/d2l/api/lp/1.31/courses/' + window.orgUnitId)
		.then((response) => {
			if (response.status !== 200) {
				console.info(`Course status not available: status code ${response.status}.`);
				return null;
			}
			return response.json();
		})
		.then((data) => {
			if (data !== null) {
				const status = getStatus(data);
				
				statusElem.innerText = status.msg;
				statusImg.src = '/shared/Widgets/CourseInfo/' + (status.available ? 'unlocked.svg' : 'locked.svg');
				statusImg.alt = statusImg.title = status.available ? lang.altActive : lang.altInactive;
				
				document.getElementById('courseStatus').style.display = 'block';
			}
		})
		.catch((error) => {
			statusElem.innerText = lang.statusUnknown;
			console.error(error);
	});

	function getStatus(courseInfo) {
		// Course is Active, but date restrictions might limit availability.
		if (courseInfo.IsActive) {
			const startDate = courseInfo.StartDate === null ? null : new Date(courseInfo.StartDate);
			const endDate = courseInfo.EndDate === null ? null : new Date(courseInfo.EndDate);
			const now = new Date();

			// Not yet started
			if (startDate !== null && now < startDate) {
				return { available: false, msg: `${lang.activeAfter} ${getDate(startDate)}` };
			}

			// Past end date, or within active window.
			if (endDate !== null) {
				return now > endDate
					? { available: false, msg: `${lang.inactiveSince} ${getDate(endDate)}` }
					: { available: true, msg: `${lang.activeUntil} ${getDate(endDate)}` };
			}

			// No date range set, or after start date (not shown, no use and not 100% reliable).
			return { available: true, msg: lang.active};
		}
		else {
			// Course is Inactive, date restrictions have no effect.
			return { available: false, msg: lang.inactive };
		}
	}

	function getDate(date) {
		return date.toLocaleString(lang.locale, { dateStyle: 'long', timeStyle: 'short' });
	}
});
