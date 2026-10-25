// The site's map for the chapter frame's menu (assets/js/frame.js). Paths are from the site root; the hubs list the same
// chapters through CHAPTERS, ECON_CHAPTERS and GEO_CHAPTERS in tools/pages.py, so add a chapter in both places.
export default {
  home: 'index.html',
  subjects: [
    { id: 'history', name: 'History', code: '0470', href: 'history.html', chapters: [
      { title: 'Eastern Europe, 1948–c.1989', note: 'Key question 6 · scroll chapter', href: 'history/kq6.html' },
      { title: 'Hungary, 1956: six sources', note: 'Paper 2 practice', href: 'history/kq6-paper2.html' },
    ] },
    { id: 'economics', name: 'Economics', code: '0455', href: 'economics.html', chapters: [
      { title: 'Government and the macroeconomy', note: 'Topic 4.1–4.4 · scroll chapter', href: 'economics/macro-policy.html' },
    ] },
    { id: 'geography', name: 'Geography', code: '0460', href: 'geography.html', chapters: [
      { title: 'Tectonic hazards', note: 'Topic 4 · scroll chapter · draft', href: 'geography/tectonics.html' },
    ] },
  ],
};
