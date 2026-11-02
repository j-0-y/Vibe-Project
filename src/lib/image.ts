/**
 * Client-side image compression for mobile photos.
 * Compresses phone camera photos (typically 4-10MB) into ~50-120KB JPEG data URL.
 * Fits comfortably inside localStorage and JSON sync rows.
 */
export function compressImage(file: File, max = 600, q = 0.65): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        try {
          let w = im.width;
          let h = im.height;
          const s = Math.min(1, max / Math.max(w, h));
          w = Math.max(1, Math.round(w * s));
          h = Math.max(1, Math.round(h * s));
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d")?.drawImage(im, 0, 0, w, h);
          let d = c.toDataURL("image/jpeg", q);
          if (d.length > 250000) {
            const c2 = document.createElement("canvas");
            c2.width = Math.max(1, Math.round(w * 0.7));
            c2.height = Math.max(1, Math.round(h * 0.7));
            c2.getContext("2d")?.drawImage(c, 0, 0, c2.width, c2.height);
            d = c2.toDataURL("image/jpeg", 0.55);
          }
          let guard = 0;
          let cw = c.width;
          let chh = c.height;
          let qq = 0.55;
          while (d.length > 220000 && guard < 3 && cw > 200) {
            guard++;
            cw = Math.max(1, Math.round(cw * 0.7));
            chh = Math.max(1, Math.round(chh * 0.7));
            qq = Math.max(0.4, qq - 0.05);
            const cx = document.createElement("canvas");
            cx.width = cw;
            cx.height = chh;
            cx.getContext("2d")?.drawImage(im, 0, 0, cw, chh);
            d = cx.toDataURL("image/jpeg", qq);
          }
          res(d);
        } catch (e) {
          rej(e);
        }
      };
      im.onerror = rej;
      im.src = r.result as string;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
