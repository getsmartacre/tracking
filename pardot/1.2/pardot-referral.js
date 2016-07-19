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

	function trackReferrals() {

		var tracker = smartacreReferralTracker,
			newReferral = getReferral(tracker.td),
			cLast = getCookie("smartacre_referral"),
			tLast = false;

		// Get last referral
		// Check for 'smartacre_referral' cookie
		// Check for newReferral

		if (cLast) {

			tLast = JSON.parse(cLast);

		} else if (newReferral) {

			tLast = newReferral;

			setCookie("smartacre_referral", JSON.stringify(tLast), false, tracker.td);

		}

		if (tLast) {

			// Populate Pardot form handler and landing page forms

			function setValue(name, value) {

				// Form handler
				var input = document.getElementsByName(name);
				for (var i = 0; i < input.length; i++) {
					input[i].value = value;
				}

				// Landing page
				var p = document.getElementsByClassName(name);
				for (var i = 0; i < p.length; i++) {
					input = p[i].children;
					input[0].value = value;
				}

			}

			setValue(tracker.fs, tLast["source"]);
			setValue(tracker.fm, tLast["medium"]);
			setValue(tracker.ft, tLast["term"]);
			setValue(tracker.fc, tLast["content"]);
			setValue(tracker.fn, tLast["campaign"]);

			setValue(tracker.ls, tLast["source"]);
			setValue(tracker.lm, tLast["medium"]);
			setValue(tracker.lt, tLast["term"]);
			setValue(tracker.lc, tLast["content"]);
			setValue(tracker.ln, tLast["campaign"]);

			setValue(tracker.cs, tLast["source"]);
			setValue(tracker.cm, tLast["medium"]);
			setValue(tracker.ct, tLast["term"]);
			setValue(tracker.cc, tLast["content"]);
			setValue(tracker.cn, tLast["campaign"]);

			// Populate Pardot iframes

			function setUrl (domain) {
				var iframes = document.getElementsByTagName("iframe");
				for (var i = 0; i < iframes.length; i++) {
					if (iframes[i].src && (iframes[i].src.indexOf(domain) > -1  || iframes[i].src.indexOf('go.pardot.com')) > -1) {

						var amp = (iframes[i].src.indexOf("?") > -1 ? "&" : "?");
						var url = iframes[i].src;

						url += amp+tracker.fs+"="+encodeURI(tLast["source"]);
						url += "&"+tracker.fm+"="+encodeURI(tLast["medium"]);
						url += "&"+tracker.ft+"="+encodeURI(tLast["term"]);
						url += "&"+tracker.fc+"="+encodeURI(tLast["content"]);
						url += "&"+tracker.fn+"="+encodeURI(tLast["campaign"]);

						url += "&"+tracker.ls+"="+encodeURI(tLast["source"]);
						url += "&"+tracker.lm+"="+encodeURI(tLast["medium"]);
						url += "&"+tracker.lt+"="+encodeURI(tLast["term"]);
						url += "&"+tracker.lc+"="+encodeURI(tLast["content"]);
						url += "&"+tracker.ln+"="+encodeURI(tLast["campaign"]);

						url += "&"+tracker.cs+"="+encodeURI(tLast["source"]);
						url += "&"+tracker.cm+"="+encodeURI(tLast["medium"]);
						url += "&"+tracker.ct+"="+encodeURI(tLast["term"]);
						url += "&"+tracker.cc+"="+encodeURI(tLast["content"]);
						url += "&"+tracker.cn+"="+encodeURI(tLast["campaign"]);

						iframes[i].src = url;

					}
				}
			}

			if (tracker.pu) {
				setUrl(tracker.pu);
			}

		}

		// Clean url
		removeUtms();

	}

	if (window.addEventListener) {
		window.addEventListener("load", trackReferrals, false);
	} else if (window.attachEvent) {
		window.attachEvent("onload", trackReferrals);
	} else {
		window.onload = trackReferrals;
	}

})();
