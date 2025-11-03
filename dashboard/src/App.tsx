import { useEffect, useState } from "react";
import { ImageItem } from "./ImageItem";

/**
 * X Manga PR Bot Dashboard
 * Single-file React component (JSX) using Tailwind CSS.
 * - Default export a React component that renders the dashboard UI
 * - Expects an API endpoint to GET entry data for a given day, e.g. /api/entry?day=5
 *
 * Expected API response shape (JSON):
 * {
 *   "day": 5,
 *   "entry": {
 *     "images": ["https://.../1.png", "https://.../2.png", ...],
 *     "trailingText": "Some text that should appear after all image posts",
 *     "meta": {
 *       "title": "Optional entry title",
 *       "scheduledAt": "2025-11-03T13:00:00Z"
 *     }
 *   }
 * }
 *
 * Behavior:
 * - Images are chunked into groups of up to 4 images per X post
 * - Each chunk becomes a TweetCard; the final TweetCard will also display the trailingText
 * - User can pick day 1..31 in sidebar/tabs
 * - Basic loading / error / empty states included
 *
 * Notes:
 * - This component uses Tailwind classes for styling. Ensure Tailwind is configured.
 * - Optional: add framer-motion for nicer animations.
 */

// Helper: chunk array into size
function chunkArray(arr: unknown[], size: number) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// TweetCard: mimic X post appearance
function TweetCard({ index, total, images, text, author = {} }: {index: number, total: number, images: string[], text: string, author: {avatarUrl?: string, displayName?: string, handle?: string}}) {
  return (
    <div className="max-w-xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img
          src={author.avatarUrl || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"}
          alt="avatar"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{author.displayName || "Manga PR Bot"}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">@{author.handle || "mangaprbot"}</div>
            <div className="ml-auto text-sm text-gray-400">{index}/{total}</div>
          </div>

          {text ? (
            <div className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{text}</div>
          ) : null}

          {images.length ? (
            <div className="mt-3">
              <ImageGrid images={images} />
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-6 text-gray-500 dark:text-gray-400 text-sm">
            <div>💬 0</div>
            <div>🔁 0</div>
            <div>❤ 0</div>
            <div>🔗</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image grid that adapts like X: 1 -> large, 2 -> split, 3 -> mosaic, 4 -> grid
function ImageGrid(props: { images: string[] }) {
  const images = props.images;

  const imageCount = images.length;

  if (imageCount === 1) {
    return (
      <div className="rounded-lg overflow-hidden">
        <ImageItem src={props.images[0]} index={0} layout={1} />
      </div>
    );
  }
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, i) => (
          <ImageItem key={i} src={src} index={i} layout={2} />
        ))}
      </div>
    );
  }
  // 3 or 4
  const cols = imageCount === 3 ? "grid-cols-2" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-2`}>
      {images.slice(0, 4).map((src, i) => (
        <ImageItem key={i} src={src} index={i} layout={imageCount} />
      ))}
    </div>
  );
}

export default function XDashboard({ apiBase = "https://script.google.com/macros/s/AKfycbzqiLrZJpkNkyFrClr767aMcaaBE_G0PJpYjDYeNhTQftRLb_OG6Yt1fTOs3MNm7ObK/exec" }) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntry(selectedDay);
  }, [selectedDay]);

  async function fetchEntry(day: number) {
    setLoading(true);
    setError(null);
    setEntry(null);
    try {
      const res = await fetch(`${apiBase}?${day}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // normalize
      const entryData = json.entry || json;
      // ensure fields exist
      entryData.images = entryData.images || [];
      entryData.trailingText = entryData.trailingText || "";
      setEntry(entryData);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // Prepare posts (chunk images into groups of up to 4). The trailingText goes on the final post.
  function buildThreadForEntry(entryData: {
    trailingText: string;
    images: string[];
  }) {
    if (!entryData) return [];
    const chunks = chunkArray(entryData.images, 4);
    const posts = chunks.map((imgs, idx) => ({
      images: imgs,
      // text: idx === chunks.length - 1 ? entryData.trailingText || "" : "",
      text: "",
      index: idx + 1,
      total: chunks.length + 1
    }));
    posts.push({ images: [], text: entryData.trailingText, index: chunks.length + 1, total: chunks.length + 1 }); 
    return posts;
  }

  const posts = buildThreadForEntry(entry);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">X Manga PR Bot 投稿内容プレビュー</h1>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => fetchEntry(selectedDay)}
              className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm"
            >
              更新
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar: days */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sticky top-6">
              <div className="text-sm text-gray-500 mb-2">日付を選択</div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const active = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`w-full py-2 text-sm rounded ${active ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">プレビュー表示</div>
                    <div className="text-lg font-semibold">{selectedDay}日</div>
                  </div>
                </div>

                <div className="mt-3">
                  {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading…</div>
                  ) : error ? (
                    <div className="py-8 text-center text-red-500">Error: {error}</div>
                  ) : !entry ? (
                    <div className="py-8 text-center text-gray-500">この日投稿される内容はありません。</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Meta */}
                      <div className="mt-3 text-sm text-gray-300">
                        <div>画像: {entry.images.length}枚</div>
                        <div>末尾テキストの文字数: {entry.trailingText.length}文字</div>
                        <div>投稿予定日時: {entry.meta?.scheduledAt || '—'}</div>
                      </div>

                      {/* Thread preview */}
                      <div className="space-y-3">
                        {posts.map((p, idx) => (
                          <TweetCard
                            key={idx}
                            index={p.index}
                            total={p.total}
                            images={p.images}
                            text={p.text}
                            author={{ displayName: 'Manga PR', handle: 'mangaprbot' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
