import { useEffect, useState } from "react";

export function ImageItem(props: { src: string, index: number, layout: number }) {
  const { src, index, layout } = props;

  const [image, setImage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // コンポーネントのアンマウント対策

    async function loadImages() {
      try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbzqiLrZJpkNkyFrClr767aMcaaBE_G0PJpYjDYeNhTQftRLb_OG6Yt1fTOs3MNm7ObK/exec?" + src);
        const json = await res.json();
        const base64Image = `data:${json.mimeType};base64,${json.base64}`;
        
        if (isMounted) {
          setImage(base64Image);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading images:", err);
      }
    }

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (loading) return <p>Loading images...</p>;

  if (layout === 1) {
    return (
      <img src={image} alt="img0" className="w-full h-72 object-cover rounded-lg" />
    );
  }
  if (layout === 2) {
    return (
      <img src={image} alt={`img1`} className="w-full h-48 object-cover rounded-lg" />
    );
  }
  return (
    <img
      src={image}
      alt={`img${index}`}
      className={`w-full ${index === 0 && layout === 3 ? "row-span-2 h-full" : "h-36"} object-cover rounded-lg`}
      style={{ objectPosition: "center" }}
    />
  );
}