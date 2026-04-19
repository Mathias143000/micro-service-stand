import { useEffect, useState } from "react";
import resolveAssetUrl from "../../lib/resolveAssetUrl";

function SafeImage({ src, fallback = "/bg.jpg", alt = "", ...props }) {
  const [resolvedSrc, setResolvedSrc] = useState(() => resolveAssetUrl(src) || fallback);

  useEffect(() => {
    setResolvedSrc(resolveAssetUrl(src) || fallback);
  }, [fallback, src]);

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (resolvedSrc !== fallback) {
          setResolvedSrc(fallback);
        }
      }}
    />
  );
}

export default SafeImage;
