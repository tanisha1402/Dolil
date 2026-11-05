import { useState } from "react";

/**
 * Mandatory buildathon sticker (navbar, always visible).
 * Drop the OFFICIAL sticker image at client/public/buildathon-sticker.png and it is used automatically.
 * Until then a text badge is shown. TODO: replace with the official file before submission.
 */
export default function StickerBadge() {
  const [imgFailed, setImgFailed] = useState(false);
  if (!imgFailed) {
    return (
      <img
        src="/buildathon-sticker.png"
        alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
        className="h-10 w-auto"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <span className="rounded-full border-2 border-mouza bg-white/70 px-3 py-1 text-[11px] font-semibold leading-tight text-mouza sm:text-xs">
      Built For Ostad Presents YUNet AIgnite Buildathon 2026
    </span>
  );
}
