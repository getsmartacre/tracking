(function () {

	function getHash(key) {
		if (!key || typeof key !== 'string') {
			return false;
		}
		try {
			var query = window.location.hash.substring(1);
			var pars = query.split("&");
			for (var i = 0; i < pars.length; i++) {
				var values = pars[i].split("=");
				if (values[0] === key && values[1] !== undefined) {
					// URL decode and sanitize
					return decodeURIComponent(values[1]).substring(0, 500);
				}
			}
		} catch (e) {
			// Silently fail on parsing errors
			return false;
		}
		return false;
	}

	function getQuery(key) {
		if (!key || typeof key !== 'string') {
			return false;
		}
		try {
			var query = window.location.search.substring(1);
			var pars = query.split("&");
			for (var i = 0; i < pars.length; i++) {
				var values = pars[i].split("=");
				if (values[0] === key && values[1] !== undefined) {
					// URL decode and sanitize
					return decodeURIComponent(values[1]).substring(0, 500);
				}
			}
		} catch (e) {
			// Silently fail on parsing errors
			return false;
		}
		return false;
	}

	function setCookie(name, value, expires, domain) {
		// Validate inputs to prevent cookie injection
		if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
			return;
		}
		if (value === null || value === undefined) {
			return;
		}
		if (domain && (typeof domain !== 'string' || domain.indexOf(';') !== -1 || domain.indexOf(',') !== -1)) {
			return;
		}
		
		try {
			// Sanitize value - remove dangerous characters
			var sanitizedValue = String(value).replace(/[;\r\n]/g, '');
			var cookie = name + "=" + encodeURIComponent(sanitizedValue) + ";";
			
			if (expires) {
				var d = new Date();
				d.setTime(d.getTime() + (expires * 24 * 60 * 60 * 1000));
				cookie += "expires=" + d.toUTCString() + ";";
			}
			
			if (domain) {
				cookie += "domain=" + domain + ";";
			}
			cookie += "path=/;SameSite=Lax";
			document.cookie = cookie;
		} catch (e) {
			// Silently fail on cookie setting errors
		}
	}

	function getCookie(name) {
		if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
			return "";
		}
		try {
			var nameEq = name + "=";
			var ca = document.cookie.split(";");
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) === " ") {
					c = c.substring(1);
				}
				if (c.indexOf(nameEq) === 0) {
					var value = c.substring(nameEq.length, c.length);
					// URL decode and limit length
					return decodeURIComponent(value).substring(0, 2000);
				}
			}
		} catch (e) {
			// Silently fail on parsing errors
			return "";
		}
		return "";
	}

	function removeUtms() {
		try {
			var l = window.location;
			if (l.hash && l.hash.indexOf("utm") !== -1) {
				if (window.history && window.history.replaceState) {
					history.replaceState({}, "", l.pathname + l.search);
				} else if (l.hash) {
					l.hash = "";
				}
			}
		} catch (e) {
			// Silently fail on history manipulation errors
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
		if (!domain || typeof domain !== 'string') {
			return false;
		}

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

		// Sanitize function to limit length and remove dangerous characters
		function sanitizeValue(val) {
			if (!val || val === false) {
				return "-";
			}
			// Limit length and remove control characters
			return String(val).replace(/[\x00-\x1F\x7F]/g, '').substring(0, 200);
		}

		if (hs || hm || ht || hc || hn) {
			n = new Referral(
				sanitizeValue(hs),
				sanitizeValue(hm),
				sanitizeValue(ht),
				sanitizeValue(hc),
				sanitizeValue(hn)
			);
		} else if (qs || qm || qt || qc || qn) {
			n = new Referral(
				sanitizeValue(qs),
				sanitizeValue(qm),
				sanitizeValue(qt),
				sanitizeValue(qc),
				sanitizeValue(qn)
			);
		} else if (ref && typeof ref === 'string' && ref.indexOf(domain) === -1) {
			// Sanitize referrer URL
			var sanitizedRef = sanitizeValue(ref);
			n = new Referral(sanitizedRef, "-", "-", "-", "-");
		} else {
			n = false;
		}

		return n;
	}

	// Value setting for legacy forms
	function setValue(name, value) {
		if (!name || typeof name !== 'string' || value === null || value === undefined) {
			return;
		}
		
		try {
			var inputs = document.getElementsByName(name);
			
			if (inputs && inputs.length > 0) {
				// Sanitize value
				var sanitizedValue = String(value).substring(0, 1000);
				
				for (var i = 0; i < inputs.length; i++) {
					// Validate that it's an input element
					if (inputs[i] && inputs[i].nodeName && 
						(inputs[i].nodeName.toLowerCase() === 'input' || 
						 inputs[i].nodeName.toLowerCase() === 'textarea' ||
						 inputs[i].nodeName.toLowerCase() === 'select')) {
						try {
							inputs[i].value = sanitizedValue;
						} catch (e) {
							// Skip if value can't be set
							continue;
						}
					}
				}
			}
		} catch (e) {
			// Silently fail on DOM manipulation errors
		}
	}

	// Value setting for multi-step forms
	function setMultiStepValue(name, value, form) {
		if (!name || typeof name !== 'string' || 
		    value === null || value === undefined ||
		    !form || typeof form.setFieldValue !== 'function') {
			return;
		}
		
		try {
			// Sanitize field name to prevent path traversal
			var sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
			if (!sanitizedName) {
				return;
			}
			
			var fieldName = `0-1/${sanitizedName}`;
			// Sanitize value
			var sanitizedValue = String(value).substring(0, 1000);
			
			form.setFieldValue(fieldName, sanitizedValue);
		} catch (e) {
			// Silently fail on form API errors
		}
	}

	// Main function to set referral data within form fields
	function trackReferrals(isMultiStep = false, form = null) {
		// If multi-step but no form, something went wrong, exit
		if (isMultiStep && !form) {
			return;
		}

		// Validate global tracker object exists
		if (typeof smartacreReferralTracker === 'undefined' || !smartacreReferralTracker) {
			return;
		}

		var tracker = smartacreReferralTracker;
		
		// Validate required tracker properties
		if (!tracker.td || typeof tracker.td !== 'string') {
			return;
		}

		var newReferral = getReferral(tracker.td),
			cLast = getCookie("smartacre_referral"),
			tLast = false;

		// Get last referral from cookie or new referral
		if (cLast) {
			try {
				tLast = JSON.parse(cLast);
				// Validate parsed object structure
				if (!tLast || typeof tLast !== 'object') {
					tLast = false;
				}
			} catch (e) {
				console.warn('[hubspot-referral] Failed to parse smartacre_referral cookie:', e);
				tLast = false;
			}
		} else if (newReferral) {
			tLast = newReferral;
			try {
				setCookie("smartacre_referral", JSON.stringify(tLast), false, tracker.td);
			} catch (e) {
				console.warn('[hubspot-referral] Failed to set smartacre_referral cookie:', e);
			}
		}

		// Populate form fields if we have referral data
		if (tLast && tracker.us && tracker.um && tracker.ut && tracker.uc && tracker.un) {
			var fieldMappings = [
				{ field: tracker.us, value: tLast.source },
				{ field: tracker.um, value: tLast.medium },
				{ field: tracker.ut, value: tLast.term },
				{ field: tracker.uc, value: tLast.content },
				{ field: tracker.un, value: tLast.campaign }
			];

			for (var i = 0; i < fieldMappings.length; i++) {
				var mapping = fieldMappings[i];
				
				if (mapping.field && mapping.value !== undefined && mapping.value !== null) {
					if (isMultiStep && form) {
						setMultiStepValue(mapping.field, mapping.value, form);
					} else {
						setValue(mapping.field, mapping.value);
					}
				}
			}
		}

		// Clean URL
		removeUtms();
	}

	window.addEventListener('message', event => {
		// Validate origin to prevent XSS attacks
		// Only accept messages from HubSpot domains
		var origin = event.origin || '';
		var isHubSpotOrigin = origin.indexOf('hubspot.com') !== -1 || 
		                      origin.indexOf('hsforms.com') !== -1 ||
		                      origin === window.location.origin;
		
		if (!isHubSpotOrigin) {
			return;
		}

		// Validate event data structure
		if (event.data && 
		    event.data.type === 'hsFormCallback' && 
		    event.data.eventName === 'onFormReady') {
			trackReferrals();
		}
	});

	window.addEventListener('hs-form-event:on-ready', (event) => {
		// Validate HubSpotFormsV4 API exists
		if (typeof HubSpotFormsV4 === 'undefined' || 
		    typeof HubSpotFormsV4.getFormFromEvent !== 'function') {
			return;
		}

		try {
			const form = HubSpotFormsV4.getFormFromEvent(event);
			trackReferrals(true, form);
		} catch (e) {
			console.warn('[hubspot-referral] HubSpot v4 form API error:', e);
		}
	});

	window.addEventListener('load', trackReferrals, false);

	trackReferrals();

})();
