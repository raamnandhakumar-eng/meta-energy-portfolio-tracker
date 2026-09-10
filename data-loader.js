(() => {
  const originalFetch = window.fetch.bind(window);
  const dataParts = [
    '/data/core.json',
    '/data/assets-1.json',
    '/data/assets-2.json',
    '/data/assets-3.json',
    '/data/assets-4.json'
  ];

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url && url.endsWith('/data/portfolio.json')) {
      const responses = await Promise.all(dataParts.map(path => originalFetch(path)));
      for (const response of responses) {
        if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}`);
      }
      const [core, ...assetParts] = await Promise.all(responses.map(response => response.json()));
      return new Response(JSON.stringify({ ...core, assets: assetParts.flat() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch(input, init);
  };
})();
