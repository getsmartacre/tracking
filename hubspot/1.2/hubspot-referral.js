(function () {

	function getHash(key) {
		var query = window.location.hash.substring(1);
		var pars = query.split("&");
		for (var i = 0; i < pars.length; i++) {
			var values = pars[i].split("=");
			if (values[0] == key) return values[1];
		}
		return (false);
	}

	function getQuery(key) {
		var query = window.location.search.substring(1);
		var pars = query.split("&");
		for (var i = 0; i < pars.length; i++) {
			var values = pars[i].split("=");
			if (values[0] == key) return values[1];
		}
		return (false);
	}

	function setCookie(name, value, expires, domain) {
		var cookie = name + "=" + value + ";";
		if (expires) {
			var d = new Date();
			d.setTime(d.getTime() + (expires*24*60*60*1000));
			cookie += "expires=" + d.toUTCString() + ";";
		}
		cookie += "domain=" + domain + ";";
		cookie += "path=/";
		document.cookie = cookie;
	}

	function getCookie(name) {
		var name = name + "=";
		var ca = document.cookie.split(";");
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==" ") c = c.substring(1);
			if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
		}
		return "";
	}

	function removeUtms() {
		var l = window.location;
		if (l.hash.indexOf("utm") != -1) {
			if (window.history.replaceState) {
				history.replaceState({}, "", l.pathname + l.search);
			} else {
				l.hash = "";
			}
		}
	}

	function Referral(source, medium, term, content, campaign) {
		this.source = source;
		this.medium = medium;
		this.term = term;
		this.content = content;
		this.campaign = campaign;
	}

	function getReferral(domain) {

		var ref = document.referrer,
			hs = getHash("utm_source"),
			hm = getHash("utm_medium"),
			ht = getHash("utm_term"),
			hc = getHash("utm_content"),
			hn = getHash("utm_campaign"),
			qs = getQuery("utm_source"),
			qm = getQuery("utm_medium"),
			qt = getQuery("utm_term"),
			qc = getQuery("utm_content"),
			qn = getQuery("utm_campaign"),
			n;

		if (hs || hm || ht || hc || hn) {

			if (!hs) hs = "-";
			if (!hm) hm = "-";
			if (!ht) ht = "-";
			if (!hc) hc = "-";
			if (!hn) hn = "-";
			n = new Referral(hs, hm, ht, hc, hn);

		} else if (qs || qm || qt || qc || qn) {

			if (!qs) qs = "-";
			if (!qm) qm = "-";
			if (!qt) qt = "-";
			if (!qc) qc = "-";
			if (!qn) qn = "-";
			n = new Referral(qs, qm, qt, qc, qn);

		} else if (ref && ref.indexOf(domain) == -1) {

			n = new Referral(ref, "-", "-", "-", "-");

		} else {

			n = false;

		}

		return n;

	}

	// Value setting for legacy forms
	function setValue(name, value) {
		var inputs = document.getElementsByName(name);
		
		if (inputs.length > 0) {
			for (var i = 0; i < inputs.length; i++) {
				inputs[i].value = value;
				console.log(`Setting ${name} to ${value}`);
			}
		}
	}

	// Value setting for multi-step forms
	function setMultiStepValue(name, value, form) {
		var fieldName = `0-1/${name}`;
		form.setFieldValue(fieldName, value);
	}

	// Main function to set referral data within form fields
	function trackReferrals(isMultiStep = false, form = null) {
		var tracker = smartacreReferralTracker,
			newReferral = getReferral(tracker.td),
			cLast = getCookie("smartacre_referral"),
			tLast = false;

		// Get last referral from cookie or new referral
		if (cLast) {
			tLast = JSON.parse(cLast);
		} else if (newReferral) {
			tLast = newReferral;
			setCookie("smartacre_referral", JSON.stringify(tLast), false, tracker.td);
		}

		// Populate form fields if we have referral data
		if (tLast) {
			var fieldMappings = [
				{ field: tracker.us, value: tLast.source },
				{ field: tracker.um, value: tLast.medium },
				{ field: tracker.ut, value: tLast.term },
				{ field: tracker.uc, value: tLast.content },
				{ field: tracker.un, value: tLast.campaign }
			];

			for (var i = 0; i < fieldMappings.length; i++) {
				var mapping = fieldMappings[i];
				
				if (isMultiStep && form) {
					setMultiStepValue(mapping.field, mapping.value, form);
				} else {
					setValue(mapping.field, mapping.value);
				}
			}
		}

		// Clean URL
		removeUtms();
	}

	window.addEventListener('message', event => {
		if (event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormReady') {
			trackReferrals();
		}
	});

	window.addEventListener('hs-form-event:on-ready', (event) => {
		const form = HubSpotFormsV4.getFormFromEvent(event);
		trackReferrals(true, form);
	});

	window.addEventListener('load', trackReferrals, false);

	trackReferrals();

})();
