// The site's map for the chapter frame's menu (assets/js/frame.js) and the home's globes (assets/js/home.js). Paths are
// from the site root; the hubs list the same chapters through CHAPTERS, ECON_CHAPTERS and GEO_CHAPTERS in
// tools/pages.py, so add a chapter in both places.
// On the home each chapter is a small globe drawn in its subject's ink (the chapters' `ink`), turned to the chapter's
// hero view (`globe`: lat, lon; a chapter about one place rings it and looks closer, `zoom`, a lens on the globe).
export default {
  home: 'index.html',
  subjects: [
    { id: 'history', name: 'History', code: '0470', href: 'history.html', ink: '#67519f', chapters: [
      { title: 'Eastern Europe, 1948–c.1989', note: 'Key question 6 · scroll chapter', href: 'history/kq6.html', globe: { lat: 47, lon: 24 } },
      { title: 'Hungary, 1956: six sources', note: 'Paper 2 practice', href: 'history/kq6-paper2.html', globe: { lat: 47.5, lon: 19, focus: [19.04, 47.5], zoom: 2.6 } },
    ] },
    { id: 'economics', name: 'Economics', code: '0455', href: 'economics.html', ink: '#0f7a58', chapters: [
      { title: 'Government and the macroeconomy', note: 'Topic 4.1–4.4 · scroll chapter', href: 'economics/macro-policy.html', globe: { lat: 22, lon: 20 } },
    ] },
    { id: 'geography', name: 'Geography', code: '0460', href: 'geography.html', ink: '#1f5fae', chapters: [
      { title: 'Tectonic hazards', note: 'Topic 4 · scroll chapter · draft', href: 'geography/tectonics.html', globe: { lat: 10, lon: 150 } },
    ] },
  ],
};
