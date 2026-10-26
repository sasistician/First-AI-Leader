/*
 * Assembler: picks one approved part per slot for a viewer's preferences.
 * Deterministic and AI-free. Loaded by demo/index.html (as window.Assembler)
 * and by the Node tests (via require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Assembler = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_DIMS = ['role', 'goal', 'industry'];

  function dimsOf(library) {
    return (library.factors && library.factors.personalized) || DEFAULT_DIMS;
  }

  function allowedValues(part, dim) {
    var v = part.fits && part.fits[dim];
    return v && v.length ? v : ['*'];
  }

  function isGeneric(part, dims) {
    return dims.every(function (d) {
      var v = allowedValues(part, d);
      return v.length === 1 && v[0] === '*';
    });
  }

  // Returns {score, matched} or null when the part conflicts with a preference.
  function scorePart(part, prefs, dims) {
    var score = 0;
    var matched = [];
    for (var i = 0; i < dims.length; i++) {
      var d = dims[i];
      var allowed = allowedValues(part, d);
      if (allowed.indexOf(prefs[d]) !== -1) {
        score++;
        matched.push(d);
      } else if (allowed.indexOf('*') === -1) {
        return null;
      }
    }
    return { score: score, matched: matched };
  }

  function byId(a, b) {
    return a.part.id < b.part.id ? -1 : a.part.id > b.part.id ? 1 : 0;
  }

  // The best-matching parts for one slot, sorted by id so choices are stable.
  function candidatesFor(library, slot, prefs, mode) {
    var dims = dimsOf(library);
    var list = [];
    library.parts.forEach(function (p) {
      if (p.slot !== slot) return;
      if (mode === 'generic') {
        if (isGeneric(p, dims)) list.push({ part: p, score: 0, matched: [] });
        return;
      }
      var s = scorePart(p, prefs, dims);
      if (s) list.push({ part: p, score: s.score, matched: s.matched });
    });
    if (!list.length) return [];
    var top = Math.max.apply(null, list.map(function (c) { return c.score; }));
    return list.filter(function (c) { return c.score === top; }).sort(byId);
  }

  /*
   * assemble(library, prefs, options)
   *   prefs:   { role, goal, industry, lang, length }
   *   options: { mode: 'yours' | 'generic', variant: integer }
   * Each "version" is one combination of tied candidates across slots.
   * The variant is read as a mixed-radix number, so the hook changes first
   * and every combination is reachable.
   */
  function assemble(library, prefs, options) {
    options = options || {};
    var mode = options.mode === 'generic' ? 'generic' : 'yours';
    var templates = (library.factors && library.factors.templates) || {};
    var template = templates[String(prefs.length)];
    if (!template) throw new Error('Unknown ad length: ' + prefs.length);

    var groups = template.map(function (step) {
      return candidatesFor(library, step.slot, prefs, mode);
    });
    var versionCount = groups.reduce(function (n, g) { return n * Math.max(1, g.length); }, 1);
    var variant = ((Math.floor(options.variant || 0) % versionCount) + versionCount) % versionCount;

    var scenes = [];
    var missing = [];
    var radix = variant;
    template.forEach(function (step, i) {
      var g = groups[i];
      if (!g.length) {
        missing.push(step.slot);
        return;
      }
      var pick = g[radix % g.length];
      radix = Math.floor(radix / g.length);
      scenes.push({
        slot: step.slot,
        seconds: step.seconds,
        part: pick.part,
        score: pick.score,
        matched: pick.matched,
        alternatives: g.length
      });
    });

    return {
      mode: mode,
      prefs: prefs,
      variant: variant,
      versionCount: versionCount,
      scenes: scenes,
      missing: missing,
      totalSeconds: scenes.reduce(function (t, s) { return t + s.seconds; }, 0)
    };
  }

  // The facts a part relies on, for the "Why this version?" panel.
  function citedSources(library, part) {
    var claims = (library.claims || []).filter(function (c) {
      return (part.claims || []).indexOf(c.id) !== -1;
    });
    var testimonial = null;
    if (part.testimonial) {
      testimonial = (library.testimonials || []).filter(function (t) {
        return t.id === part.testimonial;
      })[0] || null;
    }
    return { claims: claims, testimonial: testimonial };
  }

  function ratingKey(prefs, mode, variant) {
    return [mode, prefs.role, prefs.goal, prefs.industry, prefs.lang, prefs.length, 'v' + variant].join('|');
  }

  // ratings: { [ratingKey]: { rating: 1..5 } } → averages for generic vs yours.
  function summarizeRatings(ratings) {
    var out = { generic: { n: 0, avg: null }, yours: { n: 0, avg: null } };
    var sums = { generic: 0, yours: 0 };
    Object.keys(ratings || {}).forEach(function (key) {
      var mode = key.split('|')[0];
      var r = ratings[key] && ratings[key].rating;
      if (!out[mode] || typeof r !== 'number') return;
      out[mode].n++;
      sums[mode] += r;
    });
    ['generic', 'yours'].forEach(function (m) {
      if (out[m].n) out[m].avg = Math.round((sums[m] / out[m].n) * 10) / 10;
    });
    return out;
  }

  return {
    assemble: assemble,
    candidatesFor: candidatesFor,
    citedSources: citedSources,
    isGeneric: isGeneric,
    ratingKey: ratingKey,
    summarizeRatings: summarizeRatings
  };
});
