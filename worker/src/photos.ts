// Real photos for places, from the free-licensed lead images of Wikipedia articles,
// with the photographer's credit and licence from Wikimedia Commons.

export type Photo = {
  url: string; // a resized copy (about 1280 px wide) hosted by Wikimedia
  article: string; // the Wikipedia article it illustrates
  credit: string; // "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons"
  sourceUrl: string; // the file's page on Commons, which attribution must link to
};

const UA = 'Roamies/0.1 (travel guide app; https://github.com/abhinandhsj93-prog/roamies)';

type PagesResponse = {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<string, { title: string; pageimage?: string; thumbnail?: { source: string } }>;
  };
};
type CommonsResponse = {
  query?: { pages?: Record<string, { title: string; imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value: string }> }[] }> };
};

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return (await res.json()) as T;
}

/** Photos keyed by the article title you asked for (redirects and spelling fixes are followed). */
export async function wikiPhotos(titles: string[]): Promise<Record<string, Photo>> {
  const wanted = [...new Set(titles.filter(Boolean))].slice(0, 50);
  if (!wanted.length) return {};
  const r = await getJson<PagesResponse>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=1280&pilicense=free&titles=${encodeURIComponent(wanted.join('|'))}`,
  );
  const finalTitle = (t: string) => {
    let title = t;
    for (const map of [r.query?.normalized ?? [], r.query?.redirects ?? []]) title = map.find((m) => m.from === title)?.to ?? title;
    return title;
  };
  const byTitle = new Map(Object.values(r.query?.pages ?? {}).map((p) => [p.title, p]));
  const files = [...new Set([...byTitle.values()].map((p) => p.pageimage).filter(Boolean) as string[])];
  if (!files.length) return {};

  const c = await getJson<CommonsResponse>(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(
      files.map((f) => `File:${f}`).join('|'),
    )}`,
  );
  const credits = new Map<string, { credit: string; sourceUrl: string }>();
  for (const page of Object.values(c.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const artist = stripHtml(meta.Artist?.value ?? '') || 'Unknown';
    const licence = stripHtml(meta.LicenseShortName?.value ?? '');
    const file = page.title.replace(/^File:/, '').replace(/ /g, '_');
    credits.set(file, {
      credit: `Photo: ${artist}${licence ? `, ${licence}` : ''}, via Wikimedia Commons`,
      sourceUrl: info?.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
    });
  }

  const out: Record<string, Photo> = {};
  for (const t of wanted) {
    const page = byTitle.get(finalTitle(t));
    if (!page?.thumbnail || !page.pageimage) continue;
    const c2 = credits.get(page.pageimage.replace(/ /g, '_'));
    if (!c2) continue; // no licence information: don't use it
    out[t] = { url: page.thumbnail.source, article: page.title, ...c2 };
  }
  return out;
}
