// Try to parse different WHO shapes into a common list
function normalizeItems(raw) {
  // WHO endpoints sometimes return at top-level or nested under { items } or { value }.
  const arr =
    Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.value)
      ? raw.value
      : Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.data?.items)
      ? raw.data.items
      : [];

  return arr
    .map((it) => {
      // Title can show up under a few different keys (and sometimes as an object)
      const title =
        (typeof it.title === "string" && it.title) ||
        (typeof it.title?.rendered === "string" && it.title.rendered) ||
        it.headline ||
        it.name ||
        it.slug ||
        "";

      const summary =
        (typeof it.summary === "string" && it.summary) ||
        (typeof it.excerpt === "string" && it.excerpt) ||
        (typeof it.excerpt?.rendered === "string" && it.excerpt.rendered) ||
        it.teaser ||
        it.body ||
        "";

      const url =
        (typeof it.url === "string" && it.url) ||
        (typeof it.link === "string" && it.link) ||
        (typeof it.permalink === "string" && it.permalink) ||
        (it?.paths && `https://www.who.int${it.paths?.[0]}`) ||
        "";

      const dateRaw =
        it.date ||
        it.publishedAt ||
        it.datePublished ||
        it.firstPublished ||
        it.published ||
        it.updated ||
        it.publicationDate ||
        "";

      const published = toISODate(dateRaw);

      return {
        title: typeof title === "string" ? title : "",
        summary: typeof summary === "string" ? summary : "",
        url: typeof url === "string" ? url : "",
        published,
        raw: it,
      };
    })
    .filter((x) => x.title && x.url && x.published);
}
