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

		var mi = miReferralTracker,
			newReferral = getReferral(mi.td),
			cLast = getCookie("mi_referral"),
			tLast = false;

		// Get last referral
		// Check for 'mi_referral' cookie
		// Check for newReferral

		if (cLast) {

			tLast = JSON.parse(cLast);

		} else if (newReferral) {

			tLast = newReferral;

			setCookie("mi_referral", JSON.stringify(tLast), false, mi.td);

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

			setValue(mi.fs, tLast["source"]);
			setValue(mi.fm, tLast["medium"]);
			setValue(mi.ft, tLast["term"]);
			setValue(mi.fc, tLast["content"]);
			setValue(mi.fn, tLast["campaign"]);

			setValue(mi.ls, tLast["source"]);
			setValue(mi.lm, tLast["medium"]);
			setValue(mi.lt, tLast["term"]);
			setValue(mi.lc, tLast["content"]);
			setValue(mi.ln, tLast["campaign"]);

			setValue(mi.cs, tLast["source"]);
			setValue(mi.cm, tLast["medium"]);
			setValue(mi.ct, tLast["term"]);
			setValue(mi.cc, tLast["content"]);
			setValue(mi.cn, tLast["campaign"]);

			// Populate Pardot iframes

			function setUrl (domain) {
				var iframes = document.getElementsByTagName("iframe");
				for (var i = 0; i < iframes.length; i++) {
					if (iframes[i].src && (iframes[i].src.indexOf(domain) > -1  || iframes[i].src.indexOf('go.pardot.com')) > -1) {

						var amp = (iframes[i].src.indexOf("?") > -1 ? "&" : "?");
						var url = iframes[i].src;

						url += amp+mi.fs+"="+encodeURI(tLast["source"]);
						url += "&"+mi.fm+"="+encodeURI(tLast["medium"]);
						url += "&"+mi.ft+"="+encodeURI(tLast["term"]);
						url += "&"+mi.fc+"="+encodeURI(tLast["content"]);
						url += "&"+mi.fn+"="+encodeURI(tLast["campaign"]);

						url += "&"+mi.ls+"="+encodeURI(tLast["source"]);
						url += "&"+mi.lm+"="+encodeURI(tLast["medium"]);
						url += "&"+mi.lt+"="+encodeURI(tLast["term"]);
						url += "&"+mi.lc+"="+encodeURI(tLast["content"]);
						url += "&"+mi.ln+"="+encodeURI(tLast["campaign"]);

						url += "&"+mi.cs+"="+encodeURI(tLast["source"]);
						url += "&"+mi.cm+"="+encodeURI(tLast["medium"]);
						url += "&"+mi.ct+"="+encodeURI(tLast["term"]);
						url += "&"+mi.cc+"="+encodeURI(tLast["content"]);
						url += "&"+mi.cn+"="+encodeURI(tLast["campaign"]);

						iframes[i].src = url;

					}
				}
			}

			if (mi.pu) {
				setUrl(mi.pu);
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
